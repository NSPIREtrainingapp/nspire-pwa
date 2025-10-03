#!/usr/bin/env node

/**
 * NSPIRE Backend Test Script
 * Tests the complete authentication flow
 */

require('dotenv').config();

const testEndpoints = async () => {
    const baseUrl = 'http://localhost:3001';
    
    console.log('🧪 Testing NSPIRE Backend Endpoints');
    console.log('====================================\n');

    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    try {
        const response = await fetch(`${baseUrl}/api/health`);
        const data = await response.json();
        console.log('   ✅ Health check passed');
        console.log(`   📊 Services: GHL=${data.services.ghl}, JWT=${data.services.jwt}`);
    } catch (error) {
        console.log('   ❌ Health check failed:', error.message);
        return;
    }

    // Test 2: Demo Login
    console.log('\n2. Testing demo login...');
    try {
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'demo@nspire.app',
                password: 'demo123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginData.token && loginData.active) {
            console.log('   ✅ Demo login successful');
            console.log(`   🎭 Active: ${loginData.active}, Plan: ${loginData.plan}`);
            console.log(`   ⏱️  Login time: ${loginData.loginTime}ms`);
            
            // Test 3: Membership Status
            console.log('\n3. Testing membership status...');
            const statusResponse = await fetch(`${baseUrl}/api/membership/status`, {
                headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            
            const statusData = await statusResponse.json();
            console.log('   ✅ Membership status retrieved');
            console.log(`   📊 Active: ${statusData.active}, Plan: ${statusData.plan}`);
            
        } else {
            console.log('   ❌ Demo login failed');
            console.log('   📄 Response:', loginData);
        }
        
    } catch (error) {
        console.log('   ❌ Login test failed:', error.message);
    }

    // Test 4: Invalid Login
    console.log('\n4. Testing invalid login...');
    try {
        const invalidResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'invalid@test.com',
                password: 'wrongpass'
            })
        });
        
        if (invalidResponse.status === 403) {
            console.log('   ✅ Invalid login properly rejected');
        } else {
            console.log('   ⚠️  Unexpected response for invalid login');
        }
        
    } catch (error) {
        console.log('   ❌ Invalid login test failed:', error.message);
    }

    console.log('\n✅ Backend testing complete!');
    console.log('\n🔗 Frontend test: Open http://localhost:8080');
    console.log('🧪 Use credentials: demo@nspire.app / demo123');
};

// Run tests
testEndpoints().catch(console.error);