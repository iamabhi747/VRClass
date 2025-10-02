using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class PlayerMovement : MonoBehaviour
{
    // Variables
    [SerializeField] private float moveSpeed;
    [SerializeField] private float walkSpeed;
    [SerializeField] private float runSpeed;
    [SerializeField] private float mouseSensitivity;

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

    // Methods

    private void Start()
    {
        characterController = GetComponent<CharacterController>();
        animator = GetComponentInChildren<Animator>();

        Cursor.lockState = CursorLockMode.Locked;
    }

    private void Update()
    {
        Move();
        Rotate();
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

            moveDirection = transform.TransformDirection(moveDirection);
            moveDirection *= moveSpeed;

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

        transform.Rotate(Vector3.up * mouseX * mouseSensitivity * Time.deltaTime);
    }
}