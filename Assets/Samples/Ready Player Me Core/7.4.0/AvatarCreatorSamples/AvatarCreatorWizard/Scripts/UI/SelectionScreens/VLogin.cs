using UnityEngine;
using UnityEngine.UI;
using TMPro;


public class VLogin : State
{
    [SerializeField] private TMP_InputField emailInputField;
    [SerializeField] private TMP_InputField passwordInputField;
    [SerializeField] private Button signInButton;
    [SerializeField] private Button signUpButton;

    public override StateType StateType => StateType.VLogin;
    public override StateType NextState => StateType.GenderSelection;

    public override void ActivateState()
    {
        signInButton.onClick.AddListener(OnSignInButton);
        signUpButton.onClick.AddListener(OnSignUpButton);

        LoadingManager.EnableLoading();
        VAuthManager.Instance.LoadInitial(() =>
        {
            LoadingManager.DisableLoading();
            if (VAuthManager.IsAuthenticated())
            {
                StateMachine.SetState(NextState);
            }
        });
    }

    public override void DeactivateState()
    {
        signInButton.onClick.RemoveListener(OnSignInButton);
        signUpButton.onClick.RemoveListener(OnSignUpButton);
    }

    private void OnSignUpButton()
    {
        Debug.Log("Sign Up Button Clicked");
        StateMachine.SetState(StateType.VRegister);
    }

    private void OnSignInButton()
    {
        Debug.Log("Sign In Button Clicked");
        string email = emailInputField.text;
        string password = passwordInputField.text;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            Debug.LogWarning("Email or Password is empty.");
            return;
        }

        LoadingManager.EnableLoading(text: "Signing In...", LoadingManager.LoadingType.Popup);
        VAuthManager.Instance.Login(email, password, successMessage =>
        {
            LoadingManager.DisableLoading();
            Debug.Log("Login successful: " + successMessage);
            StateMachine.SetState(NextState);
        },
        errorMessage =>
        {
            LoadingManager.DisableLoading();
            Debug.LogError("Login failed: " + errorMessage);
        });
    }
}

