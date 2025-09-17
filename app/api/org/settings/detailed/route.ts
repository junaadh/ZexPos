import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin', 'org_admin'])

        if (!user || !user.organization_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const settingKey = searchParams.get('key')

        const supabase = await createClient()

        if (settingKey) {
            // Get specific setting
            const { data: setting, error } = await supabase
                .from('organization_settings')
                .select('*')
                .eq('organization_id', user.organization_id)
                .eq('setting_key', settingKey)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                throw error
            }

            return NextResponse.json({
                setting: setting ? {
                    key: setting.setting_key,
                    value: setting.setting_value
                } : null
            })
        } else {
            // Get all settings
            const { data: settings, error } = await supabase
                .from('organization_settings')
                .select('*')
                .eq('organization_id', user.organization_id)

            if (error) {
                throw error
            }

            const settingsMap = settings.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value
                return acc
            }, {} as Record<string, any>)

            return NextResponse.json({ settings: settingsMap })
        }

    } catch (error) {
        console.error('Error fetching organization settings:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin', 'org_admin'])

        if (!user || !user.organization_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { key, value, settings } = body

        const supabase = await createClient()

        if (key && value !== undefined) {
            // Update/create single setting
            const { data: setting, error } = await supabase
                .from('organization_settings')
                .upsert({
                    organization_id: user.organization_id,
                    setting_key: key,
                    setting_value: value,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) {
                throw error
            }

            return NextResponse.json({
                setting: {
                    key: setting.setting_key,
                    value: setting.setting_value
                }
            })
        } else if (settings && typeof settings === 'object') {
            // Update multiple settings
            const settingUpdates = Object.entries(settings).map(([settingKey, settingValue]) => ({
                organization_id: user.organization_id,
                setting_key: settingKey,
                setting_value: settingValue,
                updated_at: new Date().toISOString()
            }))

            const { data: updatedSettings, error } = await supabase
                .from('organization_settings')
                .upsert(settingUpdates)
                .select()

            if (error) {
                throw error
            }

            const settingsMap = updatedSettings.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value
                return acc
            }, {} as Record<string, any>)

            return NextResponse.json({ settings: settingsMap })
        } else {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

    } catch (error) {
        console.error('Error updating organization settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin', 'org_admin'])

        if (!user || !user.organization_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const settingKey = searchParams.get('key')

        if (!settingKey) {
            return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('organization_settings')
            .delete()
            .eq('organization_id', user.organization_id)
            .eq('setting_key', settingKey)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting organization setting:', error)
        return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
    }
}
