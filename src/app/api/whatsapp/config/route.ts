import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPhoneNumber } from '@/lib/whatsapp/meta-api'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'

/**
 * GET /api/whatsapp/config
 *
 * Fetches all saved WhatsApp Business configurations for the authenticated user,
 * decrypting access tokens to perform health verification checks against Meta.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: configs, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (configError) {
      console.error('Error fetching whatsapp_configs:', configError)
      return NextResponse.json(
        { connected: false, reason: 'db_error', message: 'Failed to fetch configurations' },
        { status: 200 }
      )
    }

    const results = []

    for (const config of configs || []) {
      let connected = false
      let decryptedToken = ''
      let decryptedVerify = ''
      let reason = null
      let message = ''
      let phoneInfo = null

      try {
        decryptedToken = decrypt(config.access_token)
        if (config.verify_token) {
          decryptedVerify = decrypt(config.verify_token)
        }

        // Validate credentials against Meta
        phoneInfo = await verifyPhoneNumber({
          phoneNumberId: config.phone_number_id,
          accessToken: decryptedToken,
        })
        connected = true
      } catch (err) {
        reason = 'meta_api_error'
        message = err instanceof Error ? err.message : 'Meta API error'
      }

      results.push({
        id: config.id,
        phone_number_id: config.phone_number_id,
        waba_id: config.waba_id,
        phone_number: config.phone_number || phoneInfo?.display_phone_number || 'Unknown Number',
        verified_name: phoneInfo?.verified_name || 'WhatsApp Business API',
        verify_token: decryptedVerify,
        connected,
        reason,
        message,
        created_at: config.created_at,
      })
    }

    return NextResponse.json({ configs: results })
  } catch (error) {
    console.error('Error in WhatsApp config GET:', error)
    return NextResponse.json(
      { connected: false, reason: 'unknown', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/config
 *
 * Saves a new WhatsApp configuration or updates an existing one for the user.
 * Verifies the credentials against Meta's API before securely encrypting and storing them.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, phone_number_id, waba_id, access_token, verify_token, phone_number } = body

    if (!access_token || !phone_number_id) {
      return NextResponse.json(
        { error: 'access_token and phone_number_id are required' },
        { status: 400 }
      )
    }

    // Verify credentials with Meta BEFORE saving
    let phoneInfo
    try {
      phoneInfo = await verifyPhoneNumber({
        phoneNumberId: phone_number_id,
        accessToken: access_token,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Meta API error'
      console.error('Meta API verification failed during save:', message)
      return NextResponse.json(
        { error: `Meta API error: ${message}` },
        { status: 400 }
      )
    }

    // Encrypt sensitive tokens before storing
    let encryptedAccessToken: string
    let encryptedVerifyToken: string | null = null
    try {
      encryptedAccessToken = encrypt(access_token)
      if (verify_token) {
        encryptedVerifyToken = encrypt(verify_token)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown encryption error'
      console.error('Encryption failed:', message)
      return NextResponse.json(
        {
          error:
            'Failed to encrypt token. Check that ENCRYPTION_KEY is a valid 64-character hex string in your environment variables.',
        },
        { status: 500 }
      )
    }

    const finalPhoneNumber = phone_number || phoneInfo?.display_phone_number || null

    if (id) {
      // Update existing config row
      const { error: updateError } = await supabase
        .from('whatsapp_config')
        .update({
          phone_number_id,
          waba_id: waba_id || null,
          phone_number: finalPhoneNumber,
          access_token: encryptedAccessToken,
          verify_token: encryptedVerifyToken,
          status: 'connected',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating whatsapp_config:', updateError)
        return NextResponse.json(
          { error: 'Failed to update configuration' },
          { status: 500 }
        )
      }
    } else {
      // Insert new config row
      const { error: insertError } = await supabase
        .from('whatsapp_config')
        .insert({
          user_id: user.id,
          phone_number_id,
          waba_id: waba_id || null,
          phone_number: finalPhoneNumber,
          access_token: encryptedAccessToken,
          verify_token: encryptedVerifyToken,
          status: 'connected',
          connected_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error inserting whatsapp_config:', insertError)
        return NextResponse.json(
          { error: 'Failed to save configuration' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, phone_info: phoneInfo })
  } catch (error) {
    console.error('Error in WhatsApp config POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/whatsapp/config
 *
 * Removes a specific WhatsApp configuration row (if ID is passed), or all configurations
 * for the user (backward compatibility/total reset).
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    let query = supabase.from('whatsapp_config').delete().eq('user_id', user.id)
    if (id) {
      query = query.eq('id', id)
    }

    const { error: deleteError } = await query

    if (deleteError) {
      console.error('Error deleting whatsapp_config:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in WhatsApp config DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
