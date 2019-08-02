import { db, offchain } from '../rest';

const topicForCoinToken = '0xeca7945f';

/**
 * This function will send whisper message
 * @param {Object} reqObj
 * @param {Object} dataToSend
 */
export async function whisperTransaction(req, dataToSend) {
  // getIdentity from local db
  const receiverName = req.body.receiver_name || req.body.payTo;

  const { shhIdentity } = await db.getWhisperIdentity(req.user);
  // PKD to get the whisperPK using name "eg: bob"
  const shhPkRecipient = await offchain.getWhisperPK(receiverName);
  const details = {
    message: dataToSend,
    shhIdentity,
    shhPkRecipient,
  };
  await offchain.sendMessage(details);
}

// user auth
/**
 * This function assign new set of whisper keys to logged in user
 * @param {Object} req
 * @param {Object} userData
 */
export async function setWhisperIdentityAndSubscribe(userData) {
  const userAddress = {
    address: userData.address,
  };
  const { shhIdentity } = await offchain.generateShhIdentity(userAddress);

  await db.updateWhisperIdentity(userData, { shhIdentity });

  const { whisperPublicKey } = await offchain.getWhisperPublicKey({ shhIdentity });
  await offchain.setWhisperPK({ address: userAddress.address }, whisperPublicKey);
  const subscribeDetails = {
    shhIdentity,
    topic: topicForCoinToken,
    jwtToken: userData.jwtToken,
    sk_A: userData.sk_A,
  };
  await offchain.subscribe(subscribeDetails);
  return shhIdentity;
}
