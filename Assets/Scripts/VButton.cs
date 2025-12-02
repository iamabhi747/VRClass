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
                            string[] imageUrls = new string[response.imageCount];
                            for (int i = 0; i < response.imageCount; i++)
                            {
                                imageUrls[i] = $"http://localhost:8000/{response.resourcePath}/{i+1}.png";
                            }
                            ResourceGallery resourceGallery = FindObjectOfType<ResourceGallery>();
                            if (resourceGallery != null)
                            {
                                resourceGallery.UpdateGallery(imageUrls);
                            }
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