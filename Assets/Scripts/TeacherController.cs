using SFB;
using TMPro;
using UnityEngine;
using Unity.Netcode;
using Unity.Collections;


[RequireComponent(typeof(CharacterController))]
public class TeacherController : NetworkBehaviour
{
    public float speed = 2f;
    public float mouseSensitivity = 2f;

    private CharacterController controller;
    private Transform cameraTransform;
    private float verticalLookRotation = 0f;
    private float horizontalLookRotation = 90f;

    private Highlighter lastHighlightedButton;
    private GameObject  PPTBoard;

    private NetworkVariable<FixedString32Bytes> netName = new NetworkVariable<FixedString32Bytes>(
        writePerm: NetworkVariableWritePermission.Server
    );

    private NetworkVariable<Vector3> netPosition = new NetworkVariable<Vector3>(
        writePerm: NetworkVariableWritePermission.Owner
    );

    void Start()
    {
        Debug.Log("TeacherController Start: {IsOwner: " + IsOwner + "}");
        controller = GetComponent<CharacterController>();
        cameraTransform = GetComponentInChildren<Camera>().transform;

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

        PPTBoard = GameObject.Find("PPTBoard");
        if (PPTBoard == null)
        {
            Debug.LogError("PPTBoard GameObject not found!");
            return;
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
            netPosition.Value = transform.position;
        }
        else
        {
            transform.position = netPosition.Value;
        }
    }

    void HandleInput()
    {
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        // transform.Rotate(Vector3.up * mouseX, Space.World);
        horizontalLookRotation += mouseX;
        verticalLookRotation -= mouseY;
        verticalLookRotation = Mathf.Clamp(verticalLookRotation, -90f, 90f);
        horizontalLookRotation = Mathf.Clamp(horizontalLookRotation, -45f, 180f);
        cameraTransform.localRotation = Quaternion.Euler(verticalLookRotation, horizontalLookRotation, 0);
        // cameraTransform.rotation = Quaternion.Euler(verticalLookRotation, horizontalLookRotation, 0f);

        float moveX = Input.GetAxis("Horizontal");
        float moveZ = Input.GetAxis("Vertical");
        Vector3 move = transform.right * moveZ - transform.forward * moveX;
        controller.Move(move * speed * Time.deltaTime);

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
                if (Input.GetKeyDown(KeyCode.E) && highlighter != null)
                {
                    var name = highlighter.getName();

                    if (name == "Action1")
                    {
                        // Pick Files/PPT to display on Board
                        var sync = PPTBoard.GetComponent<BoardImageDisplay>();
                        if (sync != null)
                        {
                            sync.PickAndUploadImage();
                        }
                    }
                    else if (name == "Action2")
                    {
                        // PPT control: Previous
                        var sync = PPTBoard.GetComponent<BoardImageDisplay>();
                        if (sync != null)
                        {
                            sync.Previous();
                        }
                    }
                    else if (name == "Action3")
                    {
                        // PPT control: Next
                        var sync = PPTBoard.GetComponent<BoardImageDisplay>();
                        if (sync != null)
                        {
                            sync.Next();
                        }
                    }
                    else if (name == "Action4")
                    {

                    }
                    else if (name == "Action5")
                    {

                    }
                    else if (name == "Action6")
                    {

                    }
                }
            }
        }
    }
}