using UnityEngine;

class TechDeskBtn_OpenObj : VButton
{
    public override void OnPress()
    {
        FileUploader fileUploader = FindObjectOfType<FileUploader>();
        if (fileUploader != null)
        {
            fileUploader.OnUploadButtonClicked(new []
            {
                new SFB.ExtensionFilter("GLTF Files", "gltf", "glb"),
            }, (fileHash) =>
            {
                if (!string.IsNullOrEmpty(fileHash))
                {
                    Debug.Log($"File uploaded successfully with hash: {fileHash}");
                    APIGateway.Process3DObject(fileHash, (response) =>
                    {
                        if (response != null && response.success)
                        {
                            Debug.Log($"3D Object processed successfully. Resource Path: {response.resourcePath}");
                            string objUrl = $"http://localhost:8000/{response.resourcePath}";
                            ResourceGallery resourceGallery = FindObjectOfType<ResourceGallery>();
                            if (resourceGallery != null)
                            {
                                resourceGallery.UpdateObjUrlServerRpc(objUrl);
                            }
                        }
                        else
                        {
                            Debug.LogError("Failed to process 3D object.");
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
}