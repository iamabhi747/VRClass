using System;
using ReadyPlayerMe.Core;
using HolisticMotionCapture;
using UnityEngine;

class LoadAvatar : MonoBehaviour
{
    [SerializeField]
    [Tooltip("RPM avatar URL or shortcode to load")]
    private string avatarUrl = "https://models.readyplayer.me/68cfbcc1621c04ac67af90cf.glb";


    [SerializeField]
    [Tooltip("Preview avatar to display until avatar loads. Will be destroyed after new avatar is loaded")]
    private GameObject previewAvatar;

    private readonly Vector3 avatarPositionOffset = new Vector3(0, 0, 0);

    private AvatarObjectLoader avatarObjectLoader;
    public event Action OnLoadComplete;
    private GameObject avatar;
    private Animator animator;
    private WebCamTexture webCamTexture;
    private HolisticMotionCapturePipeline motionCapture;

    private void Start()
    {
        avatarObjectLoader = new AvatarObjectLoader();
        avatarObjectLoader.OnCompleted += OnLoadCompleted;
        avatarObjectLoader.OnFailed += OnLoadFailed;

        if (previewAvatar != null)
        {
            SetupAvatar(previewAvatar);
        }

        Load(avatarUrl);

        webCamTexture = new WebCamTexture(WebCamTexture.devices[0].name, 640, 480);
    }

    private void OnLoadFailed(object sender, FailureEventArgs args)
    {
        OnLoadComplete?.Invoke();
    }

    private void OnLoadCompleted(object sender, CompletionEventArgs args)
    {
        if (previewAvatar != null)
        {
            Destroy(previewAvatar);
            previewAvatar = null;
        }
        SetupAvatar(args.Avatar);
        OnLoadComplete?.Invoke();
    }

    private void SetupAvatar(GameObject targetAvatar)
    {
        if (avatar != null)
        {
            Destroy(avatar);
        }

        avatar = targetAvatar;
        // Re-parent and reset transforms
        avatar.transform.parent = transform;
        // avatar.transform.SetLocalPositionAndRotation(avatarPositionOffset, Quaternion.Euler(0, 0, 0));

        // var controller = GetComponent<ThirdPersonController>();
        // if (controller != null)
        // {
        //     controller.Setup(avatar, animatorController);
        // }

        var animator = avatar.GetComponent<Animator>();
        if (animator != null && webCamTexture != null)
        {
            motionCapture = new HolisticMotionCapturePipeline(animator);
            webCamTexture.Play();
        }
        else
        {
            Debug.LogError("Animator component not found on the avatar.");
        }
    }

    public void Load(string url)
    {
        //remove any leading or trailing spaces
        avatarUrl = url.Trim(' ');
        avatarObjectLoader.LoadAvatar(avatarUrl);
    }
    

    private void Update()
    {
        if (motionCapture != null && webCamTexture != null && webCamTexture.isPlaying && webCamTexture.didUpdateThisFrame)
        {
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
    }
}