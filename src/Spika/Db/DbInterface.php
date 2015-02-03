<?php
namespace Spika\Db;

interface DbInterface
{
    public function createUser($userName,$password,$email);
    public function createUserDetail($userName,$password,$email,$about,$onlineStatus,$maxContacts,$maxFavorites,$birthday,$gender,$avatarFile,$thumbFile,$go_id,$reg_status,$invite_user_id,$create_id,$desired_team_title,$signup_team_id);
    public function unregistToken($userId);
    public function checkEmailIsUnique($email);
    public function checkUserNameIsUnique($name);
    public function checkGroupNameIsUnique($name);
    public function doSpikaAuth($email,$password);
    public function saveUserToken($userJson, $id);
    public function findUserByToken($token);
    public function findUserById($id);
    public function findUsersById($ids);
    public function findUserByEmail($email);
    public function findUserByName($name);
   // public function findUsersByAttr($key,$value,$deletePersonalInfo);
    public function getActivitySummary($user_id);
    public function updateUser($userId,$user,$secure);
    public function getEmoticons();
    public function getEmoticonByIdentifier($identifier);
    public function getEmoticonImage($emoticonId);
    public function getEmoticonById($emoticonId);
    public function getAvatarFileId($user_id);
    public function searchUserByName($name);
    public function searchUserByGender($gender);
    public function searchUserByAge($ageFrom,$ageTo);
    public function searchUser($name,$agefrom,$ageTo,$gender);
    public function addContact($userId,$targetUserId);
    public function removeContact($userId,$targetUserId);
    public function addNewUserMessage($messageType,$fromUserId,$toUserId,$message,$additionalParams);
    public function addNewGroupMessage($messageType,$fromUserId,$toGroupId,$message,$additionalParams,$teamid);
    public function getUserMessages($ownerUserId,$targetUserId,$count,$offset);
    public function getCommentCount($messageId);
    public function findMessageById($messageId,$teamid);
    public function addNewComment($messageId,$userId,$comment);
    public function getComments($messageId,$count,$offset);
    public function getGroupMessages($targetGroupId,$count,$offset,$teamid);
    public function findGroupById($id);
    public function findGroupsById($id);
    public function findGroupByName($name);
    public function findGroupByCategoryId($categoryId);
    public function findGroupsByName($name);
    public function createGroup($name,$ownerId,$categoryId,$description,$password,$avatarURL,$thumbURL,$type,$isgeneral);
    public function updateGroup($groupId,$name,$ownerId,$categoryId,$description,$password,$avatarURL,$thumbURL);
    public function deleteGroup($groupId);
    public function subscribeGroup($groupId,$userId);
    public function unSubscribeGroup($groupId,$userId);
    public function watchGroup($groupId,$userId);
    public function unWatchGroup($userId);
    public function findAllGroupCategory();
    public function updateActivitySummaryByDirectMessage($toUserId, $fromUserId);
    public function updateActivitySummaryByGroupMessage($toUserId, $fromUserId);
    public function clearActivitySummary($toUserId, $type, $fieldKey);
    public function addPassworResetRequest($toUserId);
    public function getPassworResetRequest($requestCode);
    public function changePassword($userId,$newPassword);
    public function findUserCount();
    public function findAllUsersWithPaging($offect,$count);
    public function deleteUser($id);
    public function createGroupCategory($title,$picture,$creator,$maildomain,$teamdomain,$use_domain,$invites,$skip_invites,$invites_sent);
    public function findAllGroupCategoryWithPaging($offect,$count);
    public function findGroupCategoryCount();
    public function findGroupCategoryById($id);
    public function updateGroupCategory($id,$title,$picture);
    public function deleteGroupCategory($id);
    public function createEmoticon($identifier,$picture);
    public function findAllEmoticonsWithPaging($offect,$count);
    public function findEmoticonCount();
    public function findEmoticonById($id);
    public function updateEmoticon($id,$title,$picture);
    public function deleteEmoticon($id);
    public function getMessageCount();
    public function getLastLoginedUsersCount();
    public function setMessageDelete($messageId,$deleteType,$deleteAt,$deleteAfterShownFlag);
    public function deleteMessage($messageId);
    public function getConversationHistory($user,$offset = 0,$count);
    public function getConversationHistoryCount($user);
    public function updateReadAt($messageId);
    public function getAllUsersByGroupId($groupId,$offset,$count);
    public function reportMessage($messageId);
    public function findAllUsersWithPagingWithCriteria($offect,$count,$criteria,$criteriaValues);
    public function findUserCountWithCriteria($criteria,$criteriaValues);
    public function findAllGroupsWithPagingWithCriteria($offect,$count,$criteria,$values);
    public function findGroupCountWithCriteria($criteria,$values);
    public function getContactsByUserId($userId);
    public function getContactedByUserId($userId);
    public function getGroupsByUserId($userId);
    public function getAllUsersByGroupIdWithCriteria($groupId,$offset,$count,$criteria,$values);
    public function getAllUsersCountByGroupIdWithCriteria($groupId,$criteria,$values);

    //liming
    public function findGroupCategoryByMailAndName($maildomain,$title);
    public function findGroupCatsByAttr($key,$value);
    public function findGroupCatsByMaildomain($maildomain);
    public function findUserByAttr($key,$value,$deletePersonalInfo);
    //public function findGroupsByMemberidAndCatid($groupcatId,$userId);
    public function unSubscribeGroupcat($groupcatId,$userId);
    public function findCatsByUserid($userId);
    public function findUsersByCatid($groupcatId,$deletePersonalInfo);
    public function findJoinsByUseridandCatid($userId,$groupcatId);
    public function findJoinsByUseridandGroupid($userId,$groupcatId);
    public function setTimeout($timeout);
    public function reConnect();
    public function assureConnected();
    public function findGroupsByUserid($userid);
    public function findGroupByNameAndTeamId($name,$cat_id);
    public function createTeamMessageTable($teamid);
    public function updateRecords($table, $conditions, $values);
    
}