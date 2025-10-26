using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class VRegister : State
{
    [SerializeField] private TMP_InputField nameInputField;
    [SerializeField] private TMP_InputField emailInputField;
    [SerializeField] private TMP_Dropdown roleDropdown;
    [SerializeField] private TMP_InputField passwordInputField;
    [SerializeField] private TMP_InputField confirmPasswordInputField;
    [SerializeField] private Button signUpButton;
    [SerializeField] private Button signInButton;

    public override StateType StateType => StateType.VRegister;
    public override StateType NextState => StateType.GenderSelection;

    public override void ActivateState()
    {
        signUpButton.onClick.AddListener(OnSignUpButton);
        signInButton.onClick.AddListener(OnSignInButton);

        if (VAuthManager.IsAuthenticated())
        {
            StateMachine.SetState(NextState);
        }
    }

    public override void DeactivateState()
    {
        signUpButton.onClick.RemoveListener(OnSignUpButton);
        signInButton.onClick.RemoveListener(OnSignInButton);
    }

    private void OnSignInButton()
    {
        Debug.Log("Sign In Button Clicked");
        StateMachine.SetState(StateType.VLogin);
    }

    private void OnSignUpButton()
    {
        Debug.Log("Sign Up Button Clicked");
        string name = nameInputField.text;
        string email = emailInputField.text;
        int role = roleDropdown.value + 1;
        string password = passwordInputField.text;
        string confirmPassword = confirmPasswordInputField.text;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(name) || string.IsNullOrEmpty(confirmPassword))
        {
            Debug.LogWarning("Email or Password is empty.");
            return;
        }

        if (password != confirmPassword)
        {
            Debug.LogWarning("Passwords do not match.");
            return;
        }

        LoadingManager.EnableLoading(text: "Registering...", LoadingManager.LoadingType.Popup);
        VAuthManager.Instance.Register(name, email, role, password, confirmPassword, successMessage =>
        {
            LoadingManager.DisableLoading();
            Debug.Log("Registration successful: " + successMessage);
            StateMachine.SetState(NextState);
        },
        errorMessage =>
        {
            LoadingManager.DisableLoading();
            Debug.LogError("Registration failed: " + errorMessage);
        });
    }
}

