#!/usr/bin/env node

// =============================================================================
// SYSTEM SETUP SCRIPT
// =============================================================================
// Run this script to set up the initial super admin for your ZEX-POS system

import { createSuperAdminFromEnv, checkSuperAdminExists } from '../lib/setup/super-admin'

async function setupSystem() {
    console.log('🚀 Starting ZEX-POS System Setup...\n')

    try {
        // Check if super admin already exists
        console.log('📋 Checking for existing super admin...')
        const exists = await checkSuperAdminExists()

        if (exists) {
            console.log('✅ Super admin already exists. System is ready!')
            return
        }

        console.log('👤 Creating initial super admin...')
        const result = await createSuperAdminFromEnv()

        if (result.success) {
            console.log('✅ Success:', result.message)
            console.log('\n🎉 System setup complete!')
            console.log('\n📝 Next steps:')
            console.log('1. Log in with your super admin credentials')
            console.log('2. Create your first organization')
            console.log('3. Add restaurants and staff members')
        } else {
            console.error('❌ Error:', result.message)
            if ('error' in result && result.error) {
                console.error('   Details:', result.error)
            }
            process.exit(1)
        }

    } catch (error) {
        console.error('❌ Setup failed:', error instanceof Error ? error.message : error)
        console.error('\n💡 Make sure you have set the following environment variables:')
        console.error('   - INITIAL_SUPER_ADMIN_EMAIL')
        console.error('   - INITIAL_SUPER_ADMIN_PASSWORD')
        console.error('   - INITIAL_SUPER_ADMIN_NAME (optional)')
        process.exit(1)
    }
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupSystem()
}

export { setupSystem }
