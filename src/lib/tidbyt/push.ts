type PushOptions = {
  imagePng: Buffer | Uint8Array;
};

export async function pushToTidbyt({ imagePng }: PushOptions) {
  const token = process.env.TIDBYT_API_TOKEN;
  const deviceId = process.env.TIDBYT_DEVICE_ID;
  const installationId = process.env.TIDBYT_INSTALLATION_ID ?? "fitmakerdaily";

  if (!token || !deviceId) {
    throw new Error("TIDBYT_API_TOKEN and TIDBYT_DEVICE_ID are required.");
  }

  const encoded = Buffer.from(imagePng).toString("base64");
  const response = await fetch(`https://api.tidbyt.com/v0/devices/${deviceId}/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: encoded,
      installationID: installationId,
      background: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Tidbyt push failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

