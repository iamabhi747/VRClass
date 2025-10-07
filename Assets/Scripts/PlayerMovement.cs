using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class PlayerMovement : MonoBehaviour
{
    // Variables
    [SerializeField] private float moveSpeed = 0f;
    [SerializeField] private float walkSpeed = 2f;
    [SerializeField] private float runSpeed = 5f;
    [SerializeField] private float mouseSensitivity = 250f;
    [SerializeField] private float verticalLookLimit = 30f;
    [SerializeField] private float horizontalLookLimit = 60f;

    private float verticalRotation = 0f;
    private float horizontalHeadRotation = 0f;
    private Vector3 lookAtPosition;
    private Vector3 moveDirection;
    private Vector3 velocity;

    [SerializeField] private bool isGrounded;
    [SerializeField] private float groundCheckDistance;
    [SerializeField] private LayerMask groundMask;
    [SerializeField] private float gravity;
    [SerializeField] private float jumpHeight;

    // References
    private CharacterController characterController;
    private Animator animator;
    private Camera playerCamera;
    private Transform headBone;

    // Methods

    private void Start()
    {
        characterController = GetComponent<CharacterController>();
        animator = GetComponentInChildren<Animator>();
        playerCamera = GetComponentInChildren<Camera>();

        headBone = animator.GetBoneTransform(HumanBodyBones.Head);
        // Debug.Log("Head Bone: " + headBone.name);

        playerCamera.transform.position = headBone.position;
        playerCamera.transform.SetParent(headBone);

        GameObject animatorObject = animator.gameObject;
        var ikProxy = animatorObject.AddComponent<IKProxy>();
        ikProxy.playerMovementScript = this;

        Cursor.lockState = CursorLockMode.Locked;
    }

    private void Update()
    {
        Move();
        Rotate();
    }

    private void ExecuteAnimatorIK()
    {
        animator.SetLookAtWeight(1.0f);
        animator.SetLookAtPosition(lookAtPosition);
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
            if (moveDirection.magnitude > 0.1f && Mathf.Abs(horizontalHeadRotation) > 5f)
            {
                float bodyRotationAmount = horizontalHeadRotation * Time.deltaTime * 4f;
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

    public void Rotate()
    {
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

}