/**
 * Firestoreのテストデータをクリアするスクリプト
 * 中藤優作さん（管理者）のアカウントは保持し、他のテストデータを削除
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDKの初期化
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearTestData() {
  console.log('🧹 テストデータのクリアを開始します...\n');

  try {
    // 1. 全てのtaskReportsを削除
    console.log('📋 taskReportsを削除中...');
    const taskReportsSnapshot = await db.collection('taskReports').get();
    const taskReportsBatch = db.batch();
    let taskReportsCount = 0;

    taskReportsSnapshot.forEach((doc) => {
      taskReportsBatch.delete(doc.ref);
      taskReportsCount++;
    });

    if (taskReportsCount > 0) {
      await taskReportsBatch.commit();
      console.log(`✅ ${taskReportsCount}件のtaskReportsを削除しました\n`);
    } else {
      console.log('ℹ️  削除するtaskReportsはありませんでした\n');
    }

    // 2. 中藤優作さん以外のユーザーを削除
    console.log('👤 テストユーザーを削除中...');
    const usersSnapshot = await db.collection('users').get();
    const usersBatch = db.batch();
    let deletedUsersCount = 0;
    let adminUser = null;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      // 管理者（admin/director）以外を削除
      if (userData.role !== 'admin' && userData.role !== 'director') {
        usersBatch.delete(doc.ref);
        deletedUsersCount++;
        console.log(`  - 削除: ${userData.name} (${userData.email})`);
      } else {
        adminUser = userData;
        console.log(`  ✓ 保持: ${userData.name} (${userData.email}) [管理者]`);
      }
    });

    if (deletedUsersCount > 0) {
      await usersBatch.commit();
      console.log(`✅ ${deletedUsersCount}件のテストユーザーを削除しました\n`);
    } else {
      console.log('ℹ️  削除するテストユーザーはありませんでした\n');
    }

    // 3. 招待メール（使用済みを除く）を削除
    console.log('✉️  招待メールを削除中...');
    const invitationsSnapshot = await db.collection('invitedEmails').get();
    const invitationsBatch = db.batch();
    let deletedInvitationsCount = 0;

    invitationsSnapshot.forEach((doc) => {
      const invitationData = doc.data();
      // 使用済みの招待は保持、未使用は削除
      if (!invitationData.used) {
        invitationsBatch.delete(doc.ref);
        deletedInvitationsCount++;
        console.log(`  - 削除: ${invitationData.email}`);
      }
    });

    if (deletedInvitationsCount > 0) {
      await invitationsBatch.commit();
      console.log(`✅ ${deletedInvitationsCount}件の未使用招待メールを削除しました\n`);
    } else {
      console.log('ℹ️  削除する招待メールはありませんでした\n');
    }

    console.log('✨ テストデータのクリアが完了しました！');
    console.log('\n📊 現在の状態:');
    console.log(`  - taskReports: 0件`);
    console.log(`  - users: 1件（${adminUser ? adminUser.name : '管理者'}）`);
    console.log(`  - invitedEmails: 使用済みのみ保持`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    // Firebase Admin SDKのクリーンアップ
    await admin.app().delete();
  }
}

// スクリプトの実行
clearTestData()
  .then(() => {
    console.log('\n✅ 処理が正常に完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 処理中にエラーが発生しました:', error);
    process.exit(1);
  });
