using UnityEngine;
using HolisticMotionCapture;
using VRM;

public class HolisticCharacter
{
    private Animator avatar;
    private WebCamTexture webCamTexture;
    private HolisticMotionCapturePipeline motionCapture;

    public HolisticCharacter(string VRMpath, WebCamTexture webCamTexture)
    {
        ReInit(VRMpath, webCamTexture);
    }

    private async void ReInit(string VRMpath, WebCamTexture webCamTexture)
    {
        if (!System.IO.File.Exists(VRMpath))
        {
            Debug.LogError($"VRM file not found at path: {VRMpath}");
            return;
        }

        var instance = await VrmUtility.LoadAsync(VRMpath);
        instance.ShowMeshes();

        if (avatar != null)
        {
            Object.Destroy(avatar.gameObject);
        }
        avatar = instance.GetComponent<Animator>();

        if (this.webCamTexture != null)
        {
            if (this.webCamTexture.isPlaying) this.webCamTexture.Stop();
            Object.Destroy(this.webCamTexture);
        }
        this.webCamTexture = webCamTexture;

        motionCapture?.Dispose();
        motionCapture = new HolisticMotionCapturePipeline(avatar);
    }

    public void Update()
    {
        if (motionCapture == null || avatar == null || webCamTexture == null)
        {
            Debug.LogWarning("HolisticCharacter is not fully initialized.");
            return;
        }

        motionCapture.AvatarPoseRender(
            webCamTexture, // Input Texture/Image
            null,          // LookAt target
            0.5f,          // HumanPose threshold
            0.5f,          // HandScore threshold
            0.5f,          // FaceScore threshold
            true,          // UpperBody only
            0.3f           // lerpPercentage
        );
    }

    private void OnDestroy()
    {
        if (avatar != null) Object.Destroy(avatar.gameObject);
        if (webCamTexture && webCamTexture.isPlaying) webCamTexture.Stop();
        motionCapture?.Dispose();
    }
}
