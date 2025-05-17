using TMPro;
using UnityEngine;
using Unity.Netcode;
using Unity.Collections;


[RequireComponent(typeof(CharacterController))]
public class StudentController : NetworkBehaviour
{
    public float mouseSensitivity = 2f;

    private CharacterController controller;
    private Transform cameraTransform;
    private float verticalLookRotation = 0f;
    private float horizontalLookRotation = 0f;

    private Highlighter lastHighlightedButton;
    private GameObject fullscreenCanvasPointer;
    private FullScreenViewer fullScreenViewer;

    private GameObject Action1;
    private GameObject Action2;
    private GameObject Action3;
    private GameObject Action4;

    private NetworkVariable<FixedString32Bytes> netName = new NetworkVariable<FixedString32Bytes>(
        writePerm: NetworkVariableWritePermission.Server
    );

    void Start()
    {
        Debug.Log("StudentController Start");
        controller = GetComponent<CharacterController>();
        cameraTransform = GetComponentInChildren<Camera>().transform;

        var cameraHolderTransform = cameraTransform.parent;
        cameraHolderTransform.localRotation = Quaternion.Euler(90f, 90f, 90f);
        cameraHolderTransform.localPosition = new Vector3(0.0f, 0.008f, 0.005f);

        Action1 = transform.Find("Action1")?.gameObject;
        Action2 = transform.Find("Action2")?.gameObject;
        Action3 = transform.Find("Action3")?.gameObject;
        Action4 = transform.Find("Action4")?.gameObject;

        if (!IsOwner)
        {
            cameraTransform.gameObject.SetActive(false);
        }
        else
        {
            Cursor.lockState = CursorLockMode.Locked;

            var fixedName = new FixedString32Bytes(PlayerDataHolder.LocalName);

            if (IsServer)
            {
                netName.Value = name;
            }
            else
            {
                SubmitNameServerRpc(fixedName);
            }
        }

        // netName.OnValueChanged += OnNameChanged;

        fullscreenCanvasPointer = GameObject.Find("FullScreenCanvasPointer");
        if (fullscreenCanvasPointer != null)
        {
            fullScreenViewer = fullscreenCanvasPointer.GetComponent<FullScreenViewer>();
            Debug.Log("FullScreenViewer found: " + fullScreenViewer);
        }
        else
        {
            Debug.LogError("FullScreenCanvas GameObject not found!");
        }
    }

    public override void OnNetworkSpawn()
    {
        if (IsOwner)
        {
            var fixedName = new FixedString32Bytes(PlayerDataHolder.LocalName);
            if (IsServer)
            {
                netName.Value = fixedName;
            }
            else
            {
                SubmitNameServerRpc(fixedName);
            }
        }
    }

    [ServerRpc]
    private void SubmitNameServerRpc(FixedString32Bytes name, ServerRpcParams rpcParams = default)
    {
        netName.Value = name;
    }

    void Update()
    {
        if (IsOwner)
        {
            HandleInput();
        }
    }

    void HandleInput()
    {
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        // transform.Rotate(Vector3.left * mouseX);
        verticalLookRotation -= mouseY;
        horizontalLookRotation += mouseX;
        horizontalLookRotation = Mathf.Clamp(horizontalLookRotation, -90f, 90f);
        verticalLookRotation = Mathf.Clamp(verticalLookRotation, -90f, 90f);
        cameraTransform.localRotation = Quaternion.Euler(verticalLookRotation, horizontalLookRotation, 0f);

        Ray ray = new Ray(cameraTransform.position, cameraTransform.forward);
        if (lastHighlightedButton != null)
        {
            lastHighlightedButton.RemoveHighlight();
            lastHighlightedButton = null;
        }
        if (Physics.Raycast(ray, out RaycastHit hit, 5f))
        {
            if (hit.collider.CompareTag("Interactable"))
            {
                // Highlight the object
                Highlighter highlighter = hit.collider.GetComponent<Highlighter>();
                if (highlighter != null)
                {
                    if (lastHighlightedButton != null && lastHighlightedButton != highlighter)
                        lastHighlightedButton.RemoveHighlight();

                    highlighter.Highlight();
                    lastHighlightedButton = highlighter;
                }

                // Handle interaction
                if ((Input.GetKeyDown(KeyCode.E) || Input.GetButtonDown("Fire1")) && highlighter != null)
                {
                    var name = highlighter.getName();
                    Debug.Log("Clicked on: " + name);

                    if (name == "Action1")
                    {
                        Debug.Log("Action1 clicked");
                        if (fullScreenViewer != null)
                            fullScreenViewer.Show();
                    }
                    else if (name == "Action2")
                    {

                    }
                    else if (name == "Action3")
                    {

                    }
                    else if (name == "Action4")
                    {

                    }
                }
            }
        }
    }
}