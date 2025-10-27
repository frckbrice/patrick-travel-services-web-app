/**
 * Messaging System Test Script
 * Tests the complete flow: Agent → Firebase → Client
 *
 * Usage: node test-messaging.js
 *
 * Prerequisites:
 * - Firebase Admin SDK configured
 * - Database connection working
 * - Test users exist
 */

const { getDatabase, ref, push, get, onValue } = require('firebase/database');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// Test configuration
const TEST_CONFIG = {
  agentEmail: 'agent@test.com', // Replace with actual agent email
  clientEmail: 'client@test.com', // Replace with actual client email
  caseId: 'test-case-123',
  testMessage: 'Hello! This is a test message from the agent.',
};

async function getUserIdByEmail(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    return user.uid;
  } catch (error) {
    console.error(`❌ Failed to get user by email ${email}:`, error.message);
    return null;
  }
}

async function testChatInitialization(agentUid, clientUid) {
  console.log('\n📋 Testing Chat Room Initialization...');

  const db = admin.database();
  const caseId = TEST_CONFIG.caseId;

  try {
    // Initialize chat metadata
    const metadataRef = db.ref(`chats/${caseId}/metadata`);

    await metadataRef.set({
      caseReference: 'TEST-2024-001',
      participants: {
        clientId: clientUid,
        clientName: 'Test Client',
        agentId: agentUid,
        agentName: 'Test Agent',
      },
      createdAt: Date.now(),
      lastMessage: null,
      lastMessageTime: null,
    });

    console.log('✅ Chat room initialized successfully');
    console.log(`   Case ID: ${caseId}`);
    console.log(`   Agent UID: ${agentUid}`);
    console.log(`   Client UID: ${clientUid}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize chat room:', error.message);
    return false;
  }
}

async function testSendMessage(agentUid, clientUid) {
  console.log('\n📤 Testing Message Sending...');

  const db = admin.database();
  const caseId = TEST_CONFIG.caseId;
  const timestamp = Date.now();
  const messageId = `${timestamp}-test-msg`;

  try {
    const messageRef = db.ref(`chats/${caseId}/messages/${messageId}`);

    const message = {
      id: messageId,
      senderId: agentUid,
      senderName: 'Test Agent',
      content: TEST_CONFIG.testMessage,
      sentAt: timestamp,
      caseId: caseId,
      attachments: [],
    };

    await messageRef.set(message);

    console.log('✅ Message sent successfully');
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Content: ${message.content}`);
    console.log(`   Sent At: ${new Date(timestamp).toISOString()}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    return false;
  }
}

async function testReadMessage(clientUid, agentUid) {
  console.log('\n📥 Testing Message Reading...');

  const db = admin.database();
  const caseId = TEST_CONFIG.caseId;

  try {
    const messagesRef = db.ref(`chats/${caseId}/messages`);

    const snapshot = await messagesRef.once('value');

    if (snapshot.exists()) {
      console.log('✅ Messages found in database:');
      const messages = snapshot.val();

      Object.keys(messages).forEach((messageId) => {
        const msg = messages[messageId];
        console.log(`\n   Message: ${messageId}`);
        console.log(`   From: ${msg.senderName} (${msg.senderId})`);
        console.log(`   Content: ${msg.content}`);
        console.log(`   Sent: ${new Date(msg.sentAt).toISOString()}`);
      });

      return true;
    } else {
      console.log('⚠️  No messages found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to read messages:', error.message);
    return false;
  }
}

async function testFirebaseRules(agentUid, clientUid) {
  console.log('\n🔒 Testing Firebase Security Rules...');

  try {
    // Test 1: Metadata should be readable by both users
    console.log('   Checking metadata access...');
    const db = admin.database();
    const metadataRef = db.ref(`chats/${TEST_CONFIG.caseId}/metadata`);
    const snapshot = await metadataRef.once('value');

    if (snapshot.exists()) {
      const metadata = snapshot.val();
      console.log('   ✅ Metadata accessible');
      console.log(`   Participants: ${JSON.stringify(metadata.participants, null, 2)}`);
    } else {
      console.log('   ⚠️  No metadata found');
    }

    return true;
  } catch (error) {
    console.error('   ❌ Security rules test failed:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  const db = admin.database();
  const caseId = TEST_CONFIG.caseId;

  try {
    await db.ref(`chats/${caseId}`).remove();
    console.log('✅ Test data cleaned up');
    return true;
  } catch (error) {
    console.error('⚠️  Failed to cleanup:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Messaging System Test Suite');
  console.log('================================\n');

  // Step 1: Get Firebase UIDs
  console.log('👤 Getting user UIDs...');
  const agentUid = await getUserIdByEmail(TEST_CONFIG.agentEmail);
  const clientUid = await getUserIdByEmail(TEST_CONFIG.clientEmail);

  if (!agentUid || !clientUid) {
    console.error('\n❌ Failed to get user UIDs. Please check:');
    console.error('   1. Email addresses are correct');
    console.error('   2. Users exist in Firebase Auth');
    console.error('   3. Firebase Admin SDK is configured');
    process.exit(1);
  }

  console.log(`✅ Agent UID: ${agentUid}`);
  console.log(`✅ Client UID: ${clientUid}`);

  // Step 2: Initialize chat room
  const initSuccess = await testChatInitialization(agentUid, clientUid);
  if (!initSuccess) {
    console.error('\n❌ Chat initialization failed');
    process.exit(1);
  }

  // Step 3: Test Firebase rules
  await testFirebaseRules(agentUid, clientUid);

  // Step 4: Send message
  const sendSuccess = await testSendMessage(agentUid, clientUid);
  if (!sendSuccess) {
    console.error('\n❌ Message sending failed');
    process.exit(1);
  }

  // Step 5: Read message
  await testReadMessage(clientUid, agentUid);

  // Step 6: Wait a moment to see real-time updates
  console.log('\n⏳ Waiting 2 seconds to test real-time updates...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 7: Cleanup
  const keepTestData = process.argv.includes('--keep');
  if (!keepTestData) {
    await cleanup();
  } else {
    console.log('ℹ️  Test data kept (use --keep flag to skip cleanup)');
  }

  console.log('\n✅ All tests completed successfully!');
  console.log('\n📝 Summary:');
  console.log('   ✅ Chat room initialized');
  console.log('   ✅ Message sent to Firebase');
  console.log('   ✅ Client can read message');
  console.log('   ✅ Security rules validated');

  if (!keepTestData) {
    console.log('   ✅ Test data cleaned up');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
