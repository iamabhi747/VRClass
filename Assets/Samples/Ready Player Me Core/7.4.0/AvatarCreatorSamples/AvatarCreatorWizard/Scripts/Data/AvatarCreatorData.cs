using ReadyPlayerMe.AvatarCreator;
using UnityEngine;


    [CreateAssetMenu(fileName = "AvatarCreatorData", menuName = "Ready Player Me/Avatar Creator Data", order = 1)]
    public class AvatarCreatorData : ScriptableObject
    {
        public AvatarProperties AvatarProperties;
        public bool IsExistingAvatar;

        public void Awake()
        {
            AvatarProperties = new AvatarProperties();
        }
    }

