using UnityEngine;

public class MainController : MonoBehaviour
{
    private HolisticCharacter holisticCharacter;

    private void Start()
    {
        var webCamTexture = new WebCamTexture(WebCamTexture.devices[0].name, 640, 480);
        webCamTexture.Play();


        holisticCharacter = new HolisticCharacter("/Users/iamabhi747/Downloads/DefaultSampleAvatar.vrm", webCamTexture);
    }

    private void Update()
    {
        holisticCharacter?.Update();
    }
}