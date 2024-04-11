import {
  AbstractCheqdSDKModule,
  createCheqdSDK,
  createDidPayload,
  createDidVerificationMethod,
  createKeyPairBase64,
  createVerificationKeys,
  DIDModule,
  ICheqdSDKOptions,
  ISignInputs,
  MethodSpecificIdAlgo,
  ResourceModule,
  VerificationMethods,
} from "@cheqd/sdk";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { fromString, toString } from "uint8arrays";

const main = async () => {
  const sdkOptions: ICheqdSDKOptions = {
    modules: [
      DIDModule as unknown as AbstractCheqdSDKModule,
      ResourceModule as unknown as AbstractCheqdSDKModule,
    ],
    rpcUrl: "https://rpc.cheqd.network:443",
    wallet: await DirectSecp256k1HdWallet.fromMnemonic('sketch mountain erode window enact net enrich smoke claim kangaroo another visual write meat latin bacon pulp similar forum guilt father state erase bright', { prefix: 'cheqd' }),
  };

  const sdk = await createCheqdSDK(sdkOptions);

  const keyPair = createKeyPairBase64();
  const verificationKeys = createVerificationKeys(
    keyPair.publicKey,
    MethodSpecificIdAlgo.Base58,
    "key-1"
  );
  const verificationMethods = createDidVerificationMethod(
    [VerificationMethods.JWK],
    [verificationKeys]
  );
  const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
  const signInputs: ISignInputs[] = [
    {
      verificationMethodId: didPayload.verificationMethod![0].id,
      privateKeyHex: toString(fromString(keyPair.privateKey, "base64"), "hex"),
    },
  ];
  const feePayer = (await sdkOptions.wallet.getAccounts())[0].address;
  const fee = await DIDModule.generateCreateDidDocFees(feePayer);
  const didTx = await sdk.createDidDocTx(
    signInputs,
    didPayload,
    feePayer,
    fee,
    undefined,
    undefined,
    { sdk }
  );

  console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
  console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

};

main()
  .then(() => console.log("Done"))
  .catch(console.error);
