using UnityEngine;

public class VButton : MonoBehaviour
{
    public void OnPress()
    {
        Debug.Log("Button Pressed!");

        FileUploader fileUploader = FindObjectOfType<FileUploader>();
        if (fileUploader != null)
        {
            fileUploader.OnUploadButtonClicked(new []
            {
                new SFB.ExtensionFilter("PDF Files", "pdf"),
            }, (fileHash) =>
            {
                if (!string.IsNullOrEmpty(fileHash))
                {
                    Debug.Log($"File uploaded successfully with hash: {fileHash}");
                    APIGateway.ProcessPDF(fileHash, (response) =>
                    {
                        if (response != null && response.success)
                        {
                            Debug.Log($"PDF processed successfully. Image Count: {response.imageCount}, Resource Path: {response.resourcePath}");
                        }
                        else
                        {
                            Debug.LogError("Failed to process PDF.");
                        }
                    });
                }
                else
                {
                    Debug.LogError("File upload failed.");
                }
            });
        }
    }

    public void OnHover()
    {
        // Debug.Log("Button Hovered!");
    }
}