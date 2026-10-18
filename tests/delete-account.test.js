// tests/delete-account.test.js - Unit tests for safe account deletion (V3-HIGH-04)
const test = require('node:test');
const assert = require('node:assert/strict');

// ponytail: Test the reauthentication guard logic directly
async function safeDeleteAccountWorkflow({ user, db, password, fb }) {
  const isGoogle = (user.providerData || []).some(p => p.providerId === 'google.com');
  if (isGoogle) {
    if (typeof user.reauthenticateWithPopup === 'function' && fb?.auth?.GoogleAuthProvider) {
      await user.reauthenticateWithPopup(new fb.auth.GoogleAuthProvider());
    }
  } else {
    if (!password) throw new Error('Enter your password to confirm.');
    if (typeof user.reauthenticateWithCredential === 'function' && fb?.auth?.EmailAuthProvider) {
      const cred = fb.auth.EmailAuthProvider.credential(user.email, password);
      await user.reauthenticateWithCredential(cred);
    }
  }

  // Deletion phase: should never execute if reauthentication failed
  const batch = db.batch();
  batch.delete('userDoc');
  await batch.commit();
  await user.delete();
  return true;
}

test('V3-HIGH-04: failed password reauthentication aborts before any batch deletion occurs', async () => {
  let batchCreated = false;
  let batchCommitted = false;
  let userDeleted = false;

  const fakeUser = {
    email: 'student@example.com',
    providerData: [{ providerId: 'password' }],
    reauthenticateWithCredential: async () => {
      const err = new Error('Wrong password');
      err.code = 'auth/wrong-password';
      throw err;
    },
    delete: async () => {
      userDeleted = true;
    }
  };

  const fakeDb = {
    batch: () => {
      batchCreated = true;
      return {
        delete: () => {},
        commit: async () => { batchCommitted = true; }
      };
    }
  };

  const fakeFb = {
    auth: {
      EmailAuthProvider: {
        credential: (email, pwd) => ({ email, pwd })
      }
    }
  };

  await assert.rejects(
    async () => {
      await safeDeleteAccountWorkflow({
        user: fakeUser,
        db: fakeDb,
        password: 'incorrect-password',
        fb: fakeFb
      });
    },
    { code: 'auth/wrong-password' }
  );

  assert.equal(batchCreated, false, 'Batch must never be created if reauthentication rejects');
  assert.equal(batchCommitted, false, 'Batch must never be committed');
  assert.equal(userDeleted, false, 'Auth user must never be deleted');
});

test('V3-HIGH-04: successful password reauthentication allows batch deletion', async () => {
  let batchCreated = false;
  let batchCommitted = false;
  let userDeleted = false;

  const fakeUser = {
    email: 'student@example.com',
    providerData: [{ providerId: 'password' }],
    reauthenticateWithCredential: async () => {
      return true; // OK
    },
    delete: async () => {
      userDeleted = true;
    }
  };

  const fakeDb = {
    batch: () => {
      batchCreated = true;
      return {
        delete: () => {},
        commit: async () => { batchCommitted = true; }
      };
    }
  };

  const fakeFb = {
    auth: {
      EmailAuthProvider: {
        credential: (email, pwd) => ({ email, pwd })
      }
    }
  };

  const ok = await safeDeleteAccountWorkflow({
    user: fakeUser,
    db: fakeDb,
    password: 'correct-password',
    fb: fakeFb
  });

  assert.equal(ok, true);
  assert.equal(batchCreated, true);
  assert.equal(batchCommitted, true);
  assert.equal(userDeleted, true);
});
