using UnityEngine;
using Unity.Services.Vivox;

class StudentDeskBtn_Mute : VButton
{
    public override void OnPress()
    {
        Debug.Log("StudentDeskBtn_Mute Pressed - Toggling Mute");

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