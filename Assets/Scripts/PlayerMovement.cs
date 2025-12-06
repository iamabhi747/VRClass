using UnityEngine;
using Unity.Netcode;
using ReadyPlayerMe.Core;
using System.Threading.Tasks;
using Unity.Services.Vivox;

public class PlayerMovement : NetworkBehaviour
{
    // Variables
    public int Mode = NCNetworkManager.MDEFAULT;
    [SerializeField] private float moveSpeed = 0f;
    [SerializeField] private float walkSpeed = 2f;
    [SerializeField] private float runSpeed = 5f;
    [SerializeField] private float mouseSensitivity = 250f;
    [SerializeField] private float verticalLookLimit = 50f;
    [SerializeField] private float horizontalLookLimit = 60f;

    private float verticalRotation = 0f;
    private float horizontalHeadRotation = 0f;
    private Vector3 lookAtPosition;
    private Vector3 moveDirection;
    private Vector3 velocity;
    private bool mouseInputEnabled = false;
    private bool isSpawned = false;
    private bool is2dScreenActive = false;
    private bool is3dObjectActive = false;
    private AvatarObjectLoader avatarObjectLoader;

    [SerializeField] private bool isGrounded;
    [SerializeField] private float groundCheckDistance;
    [SerializeField] private LayerMask groundMask;
    [SerializeField] private float gravity;
    [SerializeField] private float jumpHeight;

    // Networked Variables
    public NetworkVariable<Vector3> nPosition = new NetworkVariable<Vector3>();
    public NetworkVariable<float> nRotationY = new NetworkVariable<float>();
    public NetworkVariable<Vector3> nLookAtPosition = new NetworkVariable<Vector3>();
    public NetworkVariable<Vector3> nVelocity = new NetworkVariable<Vector3>();
    public NetworkVariable<bool> nIsGrounded = new NetworkVariable<bool>();
    public NetworkVariable<float> nAnimSpeed = new NetworkVariable<float>();
    public NetworkVariable<NCNetworkManager.ClientData> nClientData = new NetworkVariable<NCNetworkManager.ClientData>();

    // References
    private CharacterController characterController;
    private Animator animator;
    private Camera playerCamera;
    private Transform headBone;
    [SerializeField] private GameObject previewAvatar;
    [SerializeField] private RuntimeAnimatorController animatorController;
    [SerializeField] private bool showCrosshair = false;
    private ResourceGallery resourceGallery;
    private PersonalResourceGallery personalResourceGallery;
    private ObjectLoader objectLoader;

    // Methods

    private void Awake()
    {
        avatarObjectLoader = new AvatarObjectLoader();
        avatarObjectLoader.OnCompleted += OnSpawnLoad;
        avatarObjectLoader.OnFailed += OnSpawnFailed;

        characterController = GetComponent<CharacterController>();
        playerCamera = GetComponentInChildren<Camera>();

        resourceGallery = FindObjectOfType<ResourceGallery>();
        personalResourceGallery = FindObjectOfType<PersonalResourceGallery>();

        GameObject objectLoaderObj = GameObject.Find("3dObject");
        if (objectLoaderObj != null)
        objectLoader = objectLoaderObj.GetComponent<ObjectLoader>();
        else
        Debug.LogWarning("3dObject GameObject not found in scene.");
    }

    private void SpawnRPM()
    {
        if (isSpawned) return;
        Debug.Log("Spawning RPM Avatar...");
        Debug.Log($"Client Data: {nClientData.Value.clientId}, {nClientData.Value.name}, {nClientData.Value.serverName}, {nClientData.Value.avatarUrl}, {nClientData.Value.mode}");

        avatarObjectLoader.LoadAvatar(nClientData.Value.avatarUrl);
    }

    private void OnSpawnLoad(object sender, CompletionEventArgs args)
    {
        Debug.Log("Avatar Loaded: " + args.Avatar.name);
        GameObject avatarGo = args.Avatar;

        // Parent the avatar under this player so Animator/Head can be found in SetupAfterSpawn
        avatarGo.transform.SetParent(transform, worldPositionStays: false);
        avatarGo.transform.localPosition = previewAvatar.transform.localPosition;
        avatarGo.transform.localRotation = previewAvatar.transform.localRotation;

        previewAvatar.SetActive(false);
        Destroy(previewAvatar);

        SetupAfterSpawn();
        isSpawned = true;
    }

    private void OnSpawnFailed(object sender, FailureEventArgs args)
    {
        Debug.LogError("Avatar Load Failed: " + args.Message);
    }

    private void SetupAfterSpawn()
    {
        animator = GetComponentInChildren<Animator>();
        animator.runtimeAnimatorController = animatorController;
        headBone = animator.GetBoneTransform(HumanBodyBones.Head);
        // Debug.Log("Head Bone: " + headBone.name);

        playerCamera.transform.position = headBone.position;
        playerCamera.transform.SetParent(headBone);

        GameObject animatorObject = animator.gameObject;
        var ikProxy = animatorObject.AddComponent<IKProxy>();
        ikProxy.playerMovementScript = this;

        if (Mode == NCNetworkManager.MSTUDENT) animator.SetBool("Sit", true);
    }

    private void Update()
    {
        if (!isSpawned) return;
        #if !UNITY_SERVER

        if (IsOwner)
        {
            Move();
            Rotate();


            SyncPlayerServerRpc(
                transform.position,
                transform.eulerAngles.y,
                lookAtPosition,
                velocity,
                isGrounded,
                animator.GetFloat("Speed")
            );

            if (Input.GetKeyDown(KeyCode.Escape))
            {
                SetMouseInputEnabled(false);
            }
            else if (Input.GetMouseButtonDown(0))
            {
                SetMouseInputEnabled(true);
            }

            Interaction();
        }
        else
        {
            SyncPlayerClient();
        }
        #endif
    }

    private void ExecuteAnimatorIK()
    {
        animator.SetLookAtWeight(1.0f);
        animator.SetLookAtPosition(lookAtPosition);
    }

    private void SetMouseInputEnabled(bool enabled)
    {
        #if !UNITY_SERVER
        if (enabled && !mouseInputEnabled)
        {
            Cursor.lockState = CursorLockMode.Locked;
            mouseInputEnabled = true;
        }
        else if (!enabled && mouseInputEnabled)
        {
            Cursor.lockState = CursorLockMode.None;
            mouseInputEnabled = false;
        }
        #endif
    }

    private void Move()
    {
        isGrounded = Physics.CheckSphere(transform.position, groundCheckDistance, groundMask);

        if (isGrounded && velocity.y < 0)
        {
            velocity.y = -2f;
        }

        float moveZ = Input.GetAxis("Vertical");

        moveDirection = new Vector3(0, 0, moveZ);
        if (Mode == NCNetworkManager.MSTUDENT) moveDirection = Vector3.zero;

        if (isGrounded)
        {
            if (moveDirection != Vector3.zero)
            {
                if (Input.GetKey(KeyCode.LeftShift))
                {
                    // Run
                    moveSpeed = runSpeed;
                    animator.SetFloat("Speed", 1.0f, 0.1f, Time.deltaTime);
                }
                else
                {
                    // Walk
                    moveSpeed = walkSpeed;
                    animator.SetFloat("Speed", 0.5f, 0.1f, Time.deltaTime);
                }
            }
            else
            {
                // Idle
                moveSpeed = 0;
                animator.SetFloat("Speed", 0, 0.1f, Time.deltaTime);
            }

            float totalHorizontalRotation = transform.eulerAngles.y + horizontalHeadRotation;
            Vector3 headForward = new Vector3(
                Mathf.Sin(totalHorizontalRotation * Mathf.Deg2Rad),
                0,
                Mathf.Cos(totalHorizontalRotation * Mathf.Deg2Rad)
            );

            moveDirection = headForward * moveDirection.z;
            moveDirection *= moveSpeed;

            // Auto-align body to head direction when moving (smooth body rotation)
            if (moveDirection.magnitude > 0.1f && Mathf.Abs(horizontalHeadRotation) > 0.1f)
            {
                float bodyRotationAmount = horizontalHeadRotation * Time.deltaTime * 10f;
                transform.Rotate(0, bodyRotationAmount, 0);
                horizontalHeadRotation -= bodyRotationAmount;
                // Clamp after modification
                horizontalHeadRotation = Mathf.Clamp(horizontalHeadRotation, -horizontalLookLimit, horizontalLookLimit);
            }

            // if (Input.GetKeyDown(KeyCode.Space))
            // {
            //     // Jump
            //     velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            // }
        }
        characterController.Move(moveDirection * Time.deltaTime);

        velocity.y += gravity * Time.deltaTime;
        characterController.Move(velocity * Time.deltaTime);
    }

    private void Rotate()
    {
        if (!mouseInputEnabled) return;
        if (Input.GetMouseButton(1)) return;

        float mouseX = Input.GetAxis("Mouse X");
        float mouseY = Input.GetAxis("Mouse Y");

        horizontalHeadRotation += mouseX * mouseSensitivity * Time.deltaTime;
        horizontalHeadRotation = Mathf.Clamp(horizontalHeadRotation, -horizontalLookLimit, horizontalLookLimit);

        verticalRotation -= mouseY * mouseSensitivity * Time.deltaTime;
        verticalRotation = Mathf.Clamp(verticalRotation, -verticalLookLimit, verticalLookLimit);

        Quaternion headRotation = Quaternion.Euler(verticalRotation, transform.eulerAngles.y + horizontalHeadRotation, 0);
        Vector3 direction = headRotation * Vector3.forward;

        lookAtPosition = headBone.position + direction * 15f;
    }

    private async Task Interaction()
    {
        Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);
        RaycastHit[] hits = Physics.RaycastAll(ray, 2.1f);
        bool _showCrosshair = false;
        foreach (RaycastHit hit in hits)
        {
            if (hit.collider.CompareTag("CrosshairEnable"))
            {
                _showCrosshair = true;
            }
            else if (hit.collider.CompareTag("Button"))
            {
                hit.collider.GetComponent<VButton>().OnHover();

                if (mouseInputEnabled && Input.GetMouseButtonDown(0))
                {
                    if (hit.collider.GetComponent<DisableInput>() != null)
                    {
                        SetMouseInputEnabled(false);
                    }

                    hit.collider.GetComponent<VButton>().OnPress();

                    if (hit.collider.GetComponent<DisableInput>() != null)
                    {
                        SetMouseInputEnabled(true);
                    }
                }
            }
        }
        showCrosshair = _showCrosshair;


        if (Mode == NCNetworkManager.MTEACHER)
        {
            if (Input.GetKeyDown(KeyCode.LeftArrow))
            {
                resourceGallery.ShowNextOrPreviousServerRpc(false);
            }

            if (Input.GetKeyDown(KeyCode.RightArrow))
            {
                resourceGallery.ShowNextOrPreviousServerRpc(true);
            }

            if (Input.GetKeyDown(KeyCode.M))
            {
                if (VivoxService.Instance.IsInputDeviceMuted)
                {
                    VivoxService.Instance.UnmuteInputDevice();
                    Debug.Log("Microphone Unmuted");
                }
                else
                {
                    VivoxService.Instance.MuteInputDevice();
                    Debug.Log("Microphone Muted");
                }
            }
        }
        else if (Mode == NCNetworkManager.MSTUDENT && is2dScreenActive)
        {
            if (Input.GetKeyDown(KeyCode.LeftArrow))
            {
                resourceGallery.ShowNextOrPreviousServerRpc(false);
            }

            if (Input.GetKeyDown(KeyCode.RightArrow))
            {
                resourceGallery.ShowNextOrPreviousServerRpc(true);
            }

            if (Input.GetKeyDown(KeyCode.O) && Input.GetKey(KeyCode.LeftControl))
            {
                is2dScreenActive = false;
                personalResourceGallery.SetActive2DScreen(false);
            }

            if (Input.GetKeyDown(KeyCode.M))
            {
                if (VivoxService.Instance.IsInputDeviceMuted)
                {
                    VivoxService.Instance.UnmuteInputDevice();
                    Debug.Log("Microphone Unmuted");
                }
                else
                {
                    VivoxService.Instance.MuteInputDevice();
                    Debug.Log("Microphone Muted");
                }
            }
        }
        else if (Mode == NCNetworkManager.MSTUDENT)
        {
            if (Input.GetKeyDown(KeyCode.O) && Input.GetKey(KeyCode.LeftControl))
            {
                is2dScreenActive = true;
                personalResourceGallery.Refresh();
                personalResourceGallery.SetActive2DScreen(true);
            }

            if (Input.GetKeyDown(KeyCode.P) && Input.GetKey(KeyCode.LeftControl))
            {
                is3dObjectActive = !is3dObjectActive;
                if (is3dObjectActive)
                {
                    await objectLoader.SetActive3dObject(true);
                }
                else
                {
                    await objectLoader.SetActive3dObject(false);
                }
            }

            if (Input.GetKeyDown(KeyCode.M))
            {
                if (VivoxService.Instance.IsInputDeviceMuted)
                {
                    VivoxService.Instance.UnmuteInputDevice();
                    Debug.Log("Microphone Unmuted");
                }
                else
                {
                    VivoxService.Instance.MuteInputDevice();
                    Debug.Log("Microphone Muted");
                }
            }
        }
    }

    private void OnGUI()
    {
        if (showCrosshair)
        {
            float size = 20;
            float x = (Screen.width - size) / 2;
            float y = (Screen.height - size) / 2;
            GUI.Label(new Rect(x, y, size, size), "+");
        }
    }

    private class IKProxy : MonoBehaviour
    {
        public PlayerMovement playerMovementScript;

        void OnAnimatorIK(int layerIndex)
        {
            // Just forward the call to the main script.
            if (playerMovementScript != null)
            {
                playerMovementScript.ExecuteAnimatorIK();
            }
        }
    }

    // Network synchronization Methods

    public override async void OnNetworkSpawn()
    {
        if (IsServer)
        {
            nPosition.Value = transform.position;
            nRotationY.Value = transform.eulerAngles.y;
            nLookAtPosition.Value = lookAtPosition;
            nVelocity.Value = velocity;
            nIsGrounded.Value = isGrounded;
            nClientData.Value = NCNetworkManager.Instance.GetClientData(OwnerClientId) ?? new NCNetworkManager.ClientData();
        }

        playerCamera.enabled = IsOwner;
        characterController.enabled = true;

        AudioListener audioListener = playerCamera.GetComponent<AudioListener>();
        if (audioListener != null) audioListener.enabled = IsOwner;

        if (IsOwner && nClientData.Value.mode == NCNetworkManager.MSTUDENT)
        {
            SetMouseInputEnabled(true);

            var studentSpawnPositionMarkersObj = GameObject.Find("StudentSpawnPositionMarkers");
            if (studentSpawnPositionMarkersObj == null)
            {
                Debug.LogWarning("StudentSpawnPositionMarkers object not found in scene.");
                return;
            }

            Vector3 deskPosition = studentSpawnPositionMarkersObj.transform.GetChild(nClientData.Value.positionIndex).transform.GetChild(1).position;

            if (personalResourceGallery != null)
            {
                personalResourceGallery.SetActive2DScreen(false);
                personalResourceGallery.SetPositionAndRotation2DScreen(deskPosition + Vector3.up * 0.192f, Quaternion.Euler(30, 0, 0));
                is2dScreenActive = false;
                Debug.Log("PersonalResourceGallery positioned for student.");
            }
            else
            {
                Debug.LogWarning("PersonalResourceGallery not found in scene.");
            }

            if (objectLoader != null)
            {
                objectLoader.Delete();
                await objectLoader.SetActive3dObject(false);
                objectLoader.SetPositionAndRotation(deskPosition + new Vector3(0.0f, 0.192f, 0.0f), Quaternion.Euler(0, 0, 0));
                is3dObjectActive = false;
                Debug.Log("ObjectLoader positioned for student.");

                objectLoader.SetInitialPositionAndBoxSize(deskPosition - new Vector3(0.3f, -0.1f, 0.1f), new Vector3(0.6f, 0.6f, 0.6f));

                // await objectLoader.LoadFromUrl("https://ph0enixx.dev/static/images/Duck.glb", deskPosition - new Vector3(0.3f, -0.1f, 0.1f), new Vector3(0.6f, 0.6f, 0.6f), true);
                // objectLoader.SetActive3dObject(true);
            }
            else
            {
                Debug.LogWarning("ObjectLoader not found in scene.");
            }
        }
        else if (IsOwner && nClientData.Value.mode == NCNetworkManager.MTEACHER)
        {
            SetMouseInputEnabled(true);
        }

        Mode = nClientData.Value.mode;
        SpawnRPM();
    }

    public override void OnNetworkDespawn()
    {
        if (IsOwner)
        {
            SetMouseInputEnabled(false);
        }
    }

    [Rpc(SendTo.Server)]
    public void SyncPlayerServerRpc(
        Vector3 _position,
        float _rotationY,
        Vector3 _lookAtPosition,
        Vector3 _velocity,
        bool _isGrounded,
        float _animSpeed,
        RpcParams rpcParams = default
    )
    {
        if (!IsServer) return;

        nPosition.Value = _position;
        nRotationY.Value = _rotationY;
        nLookAtPosition.Value = _lookAtPosition;
        nVelocity.Value = _velocity;
        nIsGrounded.Value = _isGrounded;
        nAnimSpeed.Value = _animSpeed;
    }

    private void SyncPlayerClient()
    {
        if (IsOwner) return;

        transform.position = Vector3.Lerp(transform.position, nPosition.Value, 10f * Time.deltaTime);
        transform.rotation = Quaternion.Lerp(transform.rotation, Quaternion.Euler(0, nRotationY.Value, 0), 10f * Time.deltaTime);
        lookAtPosition = Vector3.Lerp(lookAtPosition, nLookAtPosition.Value, 10f * Time.deltaTime);
        velocity = Vector3.Lerp(velocity, nVelocity.Value, 10f * Time.deltaTime);
        isGrounded = nIsGrounded.Value;

        animator.SetFloat("Speed", nAnimSpeed.Value, 0.1f, Time.deltaTime);
    } 
}