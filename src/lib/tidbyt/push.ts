type PushOptions = {
  image: Buffer;
};

export async function pushToTidbyt({ image }: PushOptions) {
  const token = process.env.TIDBYT_API_TOKEN;
  const deviceId = process.env.TIDBYT_DEVICE_ID;
  const installationId = process.env.TIDBYT_INSTALLATION_ID ?? "fitmakerdaily";

  if (!token || !deviceId) {
    throw new Error("TIDBYT_API_TOKEN and TIDBYT_DEVICE_ID are required.");
  }

  const response = await fetch(`https://api.tidbyt.com/v0/devices/${deviceId}/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: image.toString("base64"),
      installationID: installationId,
      background: false, // show immediately
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Tidbyt push failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}
