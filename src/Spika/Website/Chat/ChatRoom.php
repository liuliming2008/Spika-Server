<?php
namespace Spika\Website\Chat;

require_once __DIR__.'/../../../../vendor/autoload.php';
require_once __DIR__.'/../../../../etc/constants.php';
require_once __DIR__.'/../../../../config/init.php';
require_once __DIR__.'/../../../../etc/utils.php';

use Ratchet\ConnectionInterface;
use Ratchet\Wamp\WampServerInterface;

use Doctrine\DBAL\DriverManager;
use Doctrine\DBAL\Configuration;
use Doctrine\Common\EventManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\NullHandler;
use PDO;
use Spika\Db\MySql;
use MyProject\Proxies\__CG__\OtherProject\Proxies\__CG__\stdClass;

class ChatRoom implements WampServerInterface {
    const CTRL_PREFIX = 'ctrl:';
    const CTRL_ROOMS  = 'ctrl:rooms';
    const CTRL_USER  = 'ctrl:user';

    
	
    protected $teams = array();
    protected $teamLookup = array();
    
    protected $rooms = array();
    protected $roomLookup = array();

    protected $db=null;
    
    protected $log=null;
    
    public function __construct() {
        $this->rooms[static::CTRL_ROOMS] = new \SplObjectStorage;
        
        $config = new \Doctrine\DBAL\Configuration();
        $connectionParams = array (
        	'driverOptions' => array(PDO::ATTR_PERSISTENT => true),
            'driver'    => 'pdo_mysql',
            'host'      => MySQL_HOST,
            'dbname'    => MySQL_DBNAME,
            'user'      => MySQL_USERNAME,
            'password'  => MySQL_PASSWORD,
            'charset'   => 'utf8'
    	);
        
        //$conn = \Doctrine\DBAL\DriverManager::getConnection($connectionParams, $config);
        /*if(!ENABLE_LOGGING){
        	$handler=new NullHandler();
        }
        else*/
        	$handler=new StreamHandler(__DIR__.'/../../../../logs/debug-ws.log', Logger::DEBUG, true, null);
        
        $this->log = new Logger('chatroom');
        //$this->log->pushHandler(new NullHandler());
        $this->log->pushHandler($handler);
        $this->log->addDebug('chatroom started');
        
        $handler2=new StreamHandler(__DIR__.'/../../../../logs/debug-ws-db.log', Logger::DEBUG, true, null);        
        $log2 = new Logger('chatroom');
        //$this->log->pushHandler(new NullHandler());
        $log2->pushHandler($handler2);
        $log2->addDebug('db started');
		$connection=DriverManager::getConnection($connectionParams, $config);//, $manager);
        $this->db=new MySQL(
        		$log2,
        		$connection
        );
        $this->db->setTimeout(10);
    }

    /**
     * {@inheritdoc}
     */
    public function onOpen(ConnectionInterface $conn) {
    	
        $conn->Chat        = new \StdClass;
        $conn->Chat->login = 'false';
//         $conn->Chat->rooms = array();
//         $conn->Chat->name  = $conn->WAMP->sessionId;

//         if (isset($conn->WebSocket)) {
//             $conn->Chat->name = $this->escape($conn->WebSocket->request->getCookie('name'));

//             if (empty($conn->Chat->name)) {
//                 $conn->Chat->name  = 'Anonymous ' . $conn->resourceId;
//             }
//         } else {
//             $conn->Chat->name  = 'Anonymous ' . $conn->resourceId;
//         }
        try{
	        $this->log->addDebug('assureConnected begin');
	        $this->db->assureConnected();
	        $this->log->addDebug('assureConnected end');
	        $this->db->setTimeout(2147483);
        }
        catch (PDOException $e)
        {
        	$config = new \Doctrine\DBAL\Configuration();
	        $connectionParams = array (
	        	'driverOptions' => array(PDO::ATTR_PERSISTENT => true),
	            'driver'    => 'pdo_mysql',
	            'host'      => MySQL_HOST,
	            'dbname'    => MySQL_DBNAME,
	            'user'      => MySQL_USERNAME,
	            'password'  => MySQL_PASSWORD,
	            'charset'   => 'utf8'
	    	);
	        $handler2=new StreamHandler(__DIR__.'/../../../../logs/debug-ws-db.log', Logger::DEBUG, true, null);
	        $log2 = new Logger('chatroom');
	        //$this->log->pushHandler(new NullHandler());
	        $log2->pushHandler($handler2);
	        $log2->addDebug('db started');
	        $connection=DriverManager::getConnection($connectionParams, $config);//, $manager);
	        $this->db=new MySQL(
	        		$log2,
	        		$connection
	        );
	        $this->db->setTimeout(2147483);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function onClose(ConnectionInterface $conn) {
    	try{
	    	if( !isset($conn->Chat) || !($conn->Chat->login) )
	    		return;
	    	$this->log->addDebug('onClose user:'.($conn->Chat->user['name']));
	    	
	    	//release conn resource
	        foreach ($conn->Chat->groups as $groupid => $one) {
	            //$this->onUnSubscribe($conn, $topic);
	        	$this->log->addDebug('leftChannel:'.$groupid);
	        	$this->leftChannel($conn, $groupid);
	        }
	        
	        if( isset($conn->Chat->groups ))
	        	unset($conn->Chat->groups);
	        
	        
	        //release team resource
	        if(isset($this->teams[$conn->Chat->teamid_str])){
	        	$team_chat=$this->teams[$conn->Chat->teamid_str];
	        	if(isset($team_chat->groups[$team_chat->general_group_id])){
	        		$group_general=$team_chat->groups[$team_chat->general_group_id];
	        		if($group_general->count() == 0){
	        			$this->log->addDebug('remove teamid:'.$conn->Chat->teamid);
	        			
	        			foreach ($this->teams[$conn->Chat->teamid]->groups as $groupid => $one) {
	        				unset($one);
	        			}
	        			unset($this->teams[$conn->Chat->teamid]);
	        			 
	        			//liming todo: close db connect, if teams have different db connects
	        		}
	        	}
	        }
	        unset($conn->Chat);
        }catch (Exception $e){
        	$this->log->addDebug($e->getMessage());
        }   	
    }
    
    function leftChannel(ConnectionInterface $conn,$groupid){
    	try{
	    	if( !$groupid || isset($this->teams[$conn->Chat->teamid]->groups[$groupid]))
	    		return;
	    	$this->teams[$conn->Chat->teamid]->groups[$groupid]->detach($conn);
	    	unset($conn->Chat->groups[$groupid]);
	    	if ($this->teams[$conn->Chat->teamid]->groups[$groupid]->count() == 0) {
	    		$this->log->addDebug('unset teams teamid:'.($conn->Chat->teamid).'group id'.$groupid);
	    		unset($this->teams[$conn->Chat->teamid]->groups[$groupid]);
	    		//$this->broadcast(static::CTRL_ROOMS, array($topic, 0));
	    	} else {
	    		//$this->broadcast($group['id'], array('leftRoom', $user['id']));
	    	}
    	}catch (Exception $e){
    		$this->log->addDebug($e->getMessage());
    	}
    }

    /**
     * {@inheritdoc}
     */
    function onCall(ConnectionInterface $conn, $id, $fn, array $params) {
    	try{
        switch ($fn) {
            case 'setName':
            break;
            case 'regist':
            	$email=$params['email'];
            	$token=$params['token'];
            	$teamdomain=$params['teamdomain'];
            	
            	$this->log->addDebug('regist:');
            	$this->log->addDebug('regist:'.$email.'||'.$token);
            	if (empty($email) || empty($token)) {
            		return $conn->callError($id, 'User email and token can not be empty');
            	}
            	$user=$this->db->findUserByAttr('email',$email,false);
            	$this->log->addDebug('regist');
            	$this->log->addDebug($email.$user['token'].'||'.$token);
            	
            	$ret=$this->db->findGroupCatsByAttr('teamdomain',$teamdomain);
            	$this->log->addDebug('ret total_rows '.$ret['total_rows']);
            		
            	if( $user['token'] ==  $token && $ret['total_rows']==1 ){
            		
            		$conn->Chat->email=$email;
            		$conn->Chat->token=$token;
            		$user['id']=$user['_id'];
            		unset($user['_id']);
            		$conn->Chat->user=$user;
            		
            		$team=$ret['rows'][0]['value'];
            		$team['id']=$team['_id'];
            		unset($team['_id']);
            		//$this->teams[$conn->Chat->teamid]->teamdata=$team;
            		$conn->Chat->teamid=$team['id'];
            		$conn->Chat->teamid_str=''.$team['id'];
            		$conn->Chat->groups=array();

            		if (!array_key_exists($team['id'], $this->teams)) {
            			
            			$this->teams[$conn->Chat->teamid_str] = new \StdClass;
            			$this->teams[$conn->Chat->teamid_str]->groups=array();
            			//$this->teams[$conn->Chat->teamid]->groups[groupid]=new \SplObjectStorage;
            			$this->teams[$conn->Chat->teamid_str]->teamdata=$team;
            			$this->log->addDebug('team inited:'.$team['id']);
            			
            		}
            		
            		$conn->Chat->login=true;
            		//$conn->event(static::CTRL_USER, array('true'));
            		$conn->callResult($id, array('regist' => 'true'));
            	}
            	else{
            		$conn->callResult($id, array('regist' => 'false'));
            		$conn->close();
            	}
            break;
            case 'get_users':
            	if(!($conn->Chat->login)){
            		$this->log->addDebug('not login');
            		$conn->callResult($id, array());
            		$conn->close();
            	}
            	$group_type=$params[0];
            	$url_or_name=$params[1];
            	if($group_type == "team")
            	{
	            	$ret=$this->db->findGroupCatsByAttr('teamdomain',$url_or_name);
	            	$this->log->addDebug('ret total_rows '.$ret['total_rows']);
	            	if($ret['total_rows']==1)
	            	{
	            		$team=$ret['rows'][0];
	            		$this->teams[$conn->Chat->teamid_str]->teamdata=$team;
	            		$this->log->addDebug(print_r($team,true));
	            		$this->log->addDebug($conn->Chat->user['_id']);
	            		$joins=$this->db->findJoinsByUseridandCatid($conn->Chat->user['_id'],$team['value']['_id']);
	            		$this->log->addDebug('getusers joins total_rows '.$joins['total_rows']);
	            		if( $joins['total_rows']==1 )
	            		{
	            			$users=$this->db->findUsersByCatid($team['value']['_id'],true);
	            			$this->log->addDebug($users['total_rows']);
	            			$conn->callResult($id, array('users' => json_encode($users)));            			
	            		}	            	
	            	}
            	}
            	elseif($group_type == "group_public" || $group_type == "group_private"){
            		 
            		//find group id
            		$group = $this->db->findGroupByNameAndCatid($url_or_name,$this->teams[$conn->Chat->teamid_str]->teamdata['teamdomain']);
            		//find group members
            		$users=$this->db->getAllUsersByGroupId($group['_id'],0,100000,true);
            		$conn->callResult($id, array('users' => json_encode($users)));
            	}
            	
            break;
            case 'get_run_data2':
            			if(!($conn->Chat->login)){
            				$this->log->addDebug('not login');
            				$conn->callResult($id, array());
            				$conn->close();
            			}
            			$data=array();//new \StdClass;
            			$this->log->addDebug('params '.print_r($params,true));
						$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
            				$data['team']= $team;
            				$selfuser=$conn->Chat->user;
            				$selfuser['is_restricted']=false;
            				$data['user'] = $conn->Chat->user=$selfuser;
            				$this->log->addDebug(print_r($team,true));
            				$this->log->addDebug($conn->Chat->user['id']);
            				$joins=$this->db->findJoinsByUseridandCatid($conn->Chat->user['id'],$team['id']);
            				$this->log->addDebug('get run data joins total_rows '.$joins['total_rows']);
            				if( $joins['total_rows']>=1 )
            				{
            					$users=$this->db->findUsersByCatid($team['id'],true);
            					$this->log->addDebug($users['total_rows']);
            					$users_ret=array();
            					foreach ($users['rows'] as $item )
            					{
            						$item['value']['id']=$item['value']['_id'];
            						unset($item['value']['_id']);
            						if($selfuser['id']==$item['value']['id'])
            							$item['value']['is_self'] = true;
            						$users_ret[]=$item['value'];
            						//$users_ret[$item['value']['id']]=$item['value'];
            					}
            						
            					$data['members'] = $users_ret;
            					 
            					//$team = $this->teams[$conn->Chat->teamid_str]->teamdata;
            					//$user = $conn->Chat->user;
            					$groups_team=$this->db->findGroupByCategoryId($team['id']);
            					//$groups_user=$this->db->findGroupsByUserid($user["_id"]);
            					$groups_user_array=$this->db->findGroupsByUserid($selfuser["id"]);
            					 
            					$this->log->addDebug('get run data row>=1 joins total_rows groups_user: id'.$selfuser["id"].(print_r($groups_user_array,true).(print_r($selfuser,true))));
            					$groups_all=array('groups_public'=>array(),
            							'groups_public_notmember'=>array(),
            							'groups_private' => array(),
            							'groups_ptop' => array(),
            					);
            					$this->log->addDebug('getrundata groups team joins total_rows '.$groups_team['total_rows']);
            					$non_member_cnt=0;
            					if($groups_team['total_rows']>0)
            						foreach($groups_team['rows'] as $group){
            						$group=$group['value'];
            						$group['id']=$group['_id'];
            						unset($group['_id']);
            						$users=$this->db->getAllUsersByGroupId($group['id'],0,100000,true);
            						$users_ids = array();
            						$this->log->addDebug('groups team rows > 0joins total_rows getAllUsersByGroupId'.$users['total_rows']);
            						foreach ($users['rows'] as $item )
            							$users_ids[]=$item['value']['_id'];
            						$group['members']=$users_ids;
            						//$group['num_members']=count($users_ids);
            						$this->log->addDebug(' cur group id:'.$group['id'].' getAllUsersByGroupId:'.print_r($groups_user_array,true));
            						
            						//not done!
            						$group['unread_cnt'] = 0;
            						$group['unread_highlight_cnt'] = 0;
            						//not done!
            						
            						$group['is_'.$group['type']] = true;
            						if(isset($groups_user_array[$group['id']])){
            							$group_user=$groups_user_array[$group['id']];
            							$group['time_joined'] = $group_user['created'];
            							$group['last_read'] = $group_user['last_read'];
            							$group['active'] = $group_user['active'];
            							$group['is_open'] = $group_user['is_open'];
            							$group['role'] = $group_user['role'];
            							$group['is_starred'] = $group_user['is_starred'];
            							 
            						}
            						if($group['type']=='channel'){
	            						//if(in_array($group['id'],$groups_user_array))
	            						if(isset($groups_user_array[$group['id']])){
	            							$group['is_member'] = true;	
	            							
	            						}
	            						else{
	            							$group['is_member'] = false;
	            							$non_member_cnt++;	
	            						}
	            						$data[(($group['type']).'s')][]=$group;
	            						
	            						if($group['is_general'])
	            							if( !isset($this->teams[$conn->Chat->teamid_str]->general_group_id))
	            								$this->teams[$conn->Chat->teamid_str]->general_group_id = $group['id'];
            						}
            						elseif($group['type']=='group'){
            							if(isset($groups_user_array[$group['id']]))
            								$data[(($group['type']).'s')][]=$group;
            						}
            						elseif($group['type']=='im'){
            							//$group['is_member'] = false;
            							if(isset($groups_user_array[$group['id']]) || $group['user_id'] == $selfuser['id'])
	            							foreach ($group['members'] as $item ){
	            								if($item!=$selfuser['id']){
	            									$group['user']=$item;
	            									break;
	            								}else{
	            									//$group['is_member'] = true;
	            								}
	            							}
            							if(isset($groups_user_array[$group['id']]))
            							{
            								//$group['is_member'] = true;
            								$data[(($group['type']).'s')][]=$group;
            							}
            							if($group['user_id'] == $selfuser['id']){
            								$data[(($group['type']).'s')][]=$group;
            								
            							}
            						}
            						//[$group['id']]=$group;	 
            					}
            					$data['non_member_cnt'] =$non_member_cnt;
            					$data['config']=array(
            							'max_groupname_length' => 32,
            							'can_create_channels' => true,
            					);
            					//$data->groups=$groups_all;
            					$conn->Chat->run_data=$data;
            					$this->log->addDebug(json_encode($data,JSON_NUMERIC_CHECK ));
            					$conn->callResult($id, array('data' => json_encode($data,JSON_NUMERIC_CHECK )));
            				}
            			break;
            case 'channels.create':
            	$this->log->addDebug('channels.join begin');
            	if(!($conn->Chat->login)){
            		$this->log->addDebug('not login');
            		$conn->callResult($id, array());
            		$conn->close();
            	}
            	$name=$params['name'];
            	$purpose_value=$params['purpose'];
            	
            	$user=$conn->Chat->user;
            	$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
            	$data=array();
            	$this->log->addDebug('findGroupByNameAndTeamId name:'.$name.'id'.$team['id']);
            	$channel=$this->db->findGroupByName($name);
            	//$channel=$self->app['spikadb']->findGroupByNameAndTeamId($name,$team['id']);
            	$this->log->addDebug('channels.create joins total_rows getAllUsersByGroupId'.$channel['_id']);
            	if(empty($channel)){
            		$purpose=new \StdClass;
            		$purpose->last_set=time();
            		$purpose->creator=$user['id'];
            		$purpose->value=$purpose_value;
            		$purpose_str=json_encode($purpose);
            		
            		$gropuid=$this->db->createGroup($name,$user['id'],$team['id'],$purpose_str,'','','','channel',0);
            		$ret=$this->db->subscribeGroup($gropuid,$user['id']);
            		$group=$this->db->findGroupById($gropuid);
            		$group['id']=$group['_id'];
            		unset($group['_id']);
            		$users=$this->db->getAllUsersByGroupId($group['id'],0,100000,true);
            		$users_ids = array();
            		//$this->log->addDebug('joins total_rows getAllUsersByGroupId'.$users['total_rows']);
            		foreach ($users['rows'] as $item )
            			$users_ids[]=$item['value']['_id'];
            		$group['members']=$users_ids;
            		
            		//not done!
            		$group['unread_cnt'] = 0;
            		$group['unread_highlight_cnt'] = 0;
            		 
            		$group['is_'.$group['type']] = true;
            		$group['is_member'] = true;
            		 
            		$data['channel']=$group;
            		
            		$this->broadcast($this->teams[$conn->Chat->teamid_str]->general_channel_id, $conn, array(action =>"channels.create",data => $group));
            		
//             		if(!isset($this->teams[$conn->Chat->teamid_str]->groups[$group['id']]))
//             			$this->teams[$conn->Chat->teamid_str]->groups[$group['id']]=new \SplObjectStorage;
//             		//$this->  rooms[$group['id']] = new \SplObjectStorage;
//             		//$this->  roomLookup[$group['name']] = $roomId;
//             		$this->teams[$conn->Chat->teamid_str]->groups[$group['id']]->attach($conn);
					$this->onSubscribe($conn, $group['id']);
            		
            	}else{
            		$data['error']='name_taken';
            	}
            	//restricted_action
            	
            	$conn->callResult($id, array('data' => json_encode($data,JSON_NUMERIC_CHECK )));
            	
            	break;
            case 'channels.join':
            		$this->log->addDebug('channels.join begin');
            		if(!($conn->Chat->login)){
            			$this->log->addDebug('not login');
            			$conn->callResult($id, array());
            			$conn->close();
            		}
            		$groupsid=$params['id'];
            		$user=$conn->Chat->user;
            		$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
            		$data=array();
            		//$this->log->addDebug('channels.join findGroupById :'.$name.'id'.$team['id']);
            		$channel=$this->db->findGroupById($groupsid);
            		//$channel=$self->app['spikadb']->findGroupByNameAndTeamId($name,$team['id']);
            		$this->log->addDebug('channel.join findGroupById'.$channel['_id']);
            		if(!empty($channel)){
            			//$gropuid=$this->db->createGroup($name,$user['id'],$team['id'],"",'','','','channel',0);
            			$ret=$this->db->subscribeGroup($channel['_id'],$user['id']);
            			$group=$channel;
            			$group['id']=$group['_id'];
            			unset($group['_id']);
            			$users=$this->db->getAllUsersByGroupId($group['id'],0,100000,true);
            			$users_ids = array();
            			//$this->log->addDebug('joins total_rows getAllUsersByGroupId'.$users['total_rows']);
            			foreach ($users['rows'] as $item )
            				$users_ids[]=$item['value']['_id'];
            			$group['members']=$users_ids;
            			//not done!
            			$group['unread_cnt'] = 0;
            			$group['unread_highlight_cnt'] = 0;
            			 
            			$group['is_'.$group['type']] = true;
            			$group['is_member'] = true;
            			 
            			$data['channel']=$group;
            			
//             			if(!isset($this->teams[$conn->Chat->teamid_str]->groups[$group['id']]))
//             				$this->teams[$conn->Chat->teamid_str]->groups[$group['id']]=new \SplObjectStorage;
            			
//             			$this->log->addDebug('join team:'.$conn->Chat->teamid_str." group:".$group['id']);
            			
//             			$this->teams[$conn->Chat->teamid_str]->groups[$group['id']]->attach($conn);
//             			$conn->Chat->groups[$group['id']]=true;
						$this->onSubscribe($conn, $group['id']);
            			
            			 
            		}else{
            			$data['error']='channel_none';
            		}
            		//restricted_action
            		 
            		$conn->callResult($id, array('data' => json_encode($data,JSON_NUMERIC_CHECK )));
            		 
            break;
            case 'channels.leave':
            	$this->log->addDebug('channels.join begin');
            		if(!($conn->Chat->login)){
            			$this->log->addDebug('not login');
            			$conn->callResult($id, array());
            			$conn->close();
            		}
            		$groupsid=$params['channel'];
            		$user=$conn->Chat->user;
            		$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
            		$data=array();
            		$this->log->addDebug('findGroupByNameAndTeamId channel id:'.$groupsid.'id'.$team['id']);
            		$group=$this->db->findGroupById($groupsid);
            		//$channel=$self->app['spikadb']->findGroupByNameAndTeamId($name,$team['id']);
            		
            		if(!empty($group)){
            			//$gropuid=$this->db->createGroup($name,$user['id'],$team['id'],"",'','','','channel',0);
            			$this->log->addDebug('joins total_rows getAllUsersByGroupId'.$group['_id']);
            			if( $group['type'] != 'im')
            				$ret=$this->db->unsubscribeGroup($group['_id'],$user['id']);
            			else {
            				// set  usergroup is_archived true
            				
            			}
            			$this->log->addDebug('leftChannel user:'.($user['name']).'group id'.$group['_id']);
//             			$this->leftChannel($conn, $group['id']);
            			$this->onUnSubscribe($conn, $group['_id']);
            			$data['status']=true;
            		}else{
            			$data['error']='channel_none';
            		}
            		//restricted_action
            		 
            		$conn->callResult($id, array('data' => json_encode($data,JSON_NUMERIC_CHECK )));
            			 
            break;
            case 'channels.setlastread':
            	$channel_id=$params['id'];
            	$ts=$params['ts'];
            	$user=$conn->Chat->user;
            	$ret=$this->db->updateRecords("user_group", array('group_id'=>$channel_id,'user_id'=>$user['id']), 
            	array('last_read'=>$ts)); //microtime(true)
            	if($ret){
            		$user_groups = $this->db->findJoinsByUseridandGroupid($user['id'], $channel_id);
            		if( $user_groups['total_rows'] == 1){
            			$data=array();
            			$data['status']=true;
            			$data['channel']=$user_groups['rows'][0];
            			$conn->callResult($id, array('data' => json_encode($data,JSON_NUMERIC_CHECK )));
            		}
            	}
            break;
            case 'channels.sendmsg':
            case 'groups.sendmsg':
            case 'ims.sendmsg':
            	$command = $fn;	
            	$this->log->addDebug('channels.sendmsg begin');
            	if(!($conn->Chat->login)){
            		$this->log->addDebug('not login');
            		$conn->callResult($id, array());
            		$conn->close();
            	}
            	$channel_id=$params['id'];
            	$msg=$params['msg'];
            	$type=$params['type'];//
            	$subtype=$params['subtype'];//
            	 
            	$user=$conn->Chat->user;
            	//$team=$this->teams[$conn->Chat->teamid]->teamdata;
            	$data=array();
            	$ret=$this->db->addNewGroupMessage("text",$user['id'],$channel_id,$msg, array('type'=>$type,'subtype'=>$subtype),$conn->Chat->teamid);
            	if($ret['ok']){
            		$data['msg']=$this->db->findMessageById($ret['id'],$conn->Chat->teamid);
            		$data['status']=true;
            	}	
            	else 
            		$data['error']='fail';
            	//restricted_action
            
            	$conn->callResult($id, array('data' => json_encode($data )));
            	 
            	$this->broadcast($channel_id, $conn, array($command, $data['msg']));
            	
            	break;
            case 'channels.getmsgs':
            	$this->log->addDebug('channels.getmsgs begin');
            	if(!($conn->Chat->login)){
            		$this->log->addDebug('not login');
            		$conn->callResult($id, array());
            		$conn->close();
            	}
            	$channel_id=$params['id'];
            	$user=$conn->Chat->user;
            	$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
            	$data=array();
            	
            	$ret=$this->db->getGroupMessages($channel_id,100000,0,$team['id']);
            	$msgs=array();
//             	if(isset($ret['total_rows'])){
            		foreach ($ret['rows'] as $item )
            		{
            			$msg = $item['value'];
            			$msg['id']=$msg['_id'];
            			unset($msg['_id']);
            			//$msg['is_ephemeral']=false;
            			$msgs[]=$msg;
            		}
            			
            		$data['msgs']=$msgs;
//             	}
//             	else
//             		$data['error']='fail';
            	
            	//restricted_action
            
            	$conn->callResult($id, array('data' => json_encode($data )));
            
            break;
            case 'channels.mark':
            case 'groups.mark':
            case 'ims.mark':
				
            break;
            case 'createRoom':
//                 $topic   = $this->escape($params[0]);
//                 $created = false;

//                 if (empty($topic)) {
//                     return $conn->callError($id, 'Room name can not be empty');
//                 }

//                 if (array_key_exists($topic, $this->roomLookup)) {
//                     $roomId = $this->roomLookup[$topic];
//                 } else {
//                     $created = true;
//                     $roomId  = uniqid('room-');

//                     $this->broadcast(static::CTRL_ROOMS, array($roomId, $topic, 1));
//                 }

//                 if ($created) {
//                     $this->rooms[$roomId] = new \SplObjectStorage;
//                     $this->roomLookup[$topic] = $roomId;

//                     return $conn->callResult($id, array('id' => $roomId, 'display' => $topic));
//                 } else {
//                     return $conn->callError($id, array('id' => $roomId, 'display' => $topic));
//                 }
            break;

            default:
                return $conn->callError($id, 'Unknown call');
            break;
        }
    	}catch (Exception $e){
    		$this->log->addDebug($e->getMessage());
    	}
    }

    /**
     * {@inheritdoc}
     */
    function onSubscribe(ConnectionInterface $conn, $topic) {
        // Send all the rooms to the person who just subscribed to the room list
//         if (static::CTRL_ROOMS == $topic) {
//             foreach ($this->rooms as $room => $patrons) {
//                 if (!$this->isControl($room)) {
//                     $conn->event(static::CTRL_ROOMS, array($room, array_search($room, $this->roomLookup), 1));
//                 }
//             }
//         }

//         // Room does not exist
//         if (!array_key_exists($topic, $this->rooms)) {
//             return;
//         }

//         // Notify everyone this guy has joined the room they're in
//         $this->broadcast($topic, array('joinRoom', $conn->WAMP->sessionId, $conn->Chat->name), $conn);

//         // List all the people already in the room to the person who just joined
//         foreach ($this->rooms[$topic] as $patron) {
//             $conn->event($topic, array('joinRoom', $patron->WAMP->sessionId, $patron->Chat->name));
//         }

//         $this->rooms[$topic]->attach($conn);

//         $conn->Chat->rooms[$topic] = 1;
		if( $topic == NULL )
			return;
    	$this->log->addDebug('onSubscribe topic :'.var_export($topic,true));
    	$groupsid=$topic;
    	$user=$conn->Chat->user;
    	$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
    	//$data=array();
    	//$this->log->addDebug('channels.join findGroupById :'.$name.'id'.$team['id']);
    	$channel=$this->db->findGroupById($groupsid);
    	//$channel=$self->app['spikadb']->findGroupByNameAndTeamId($name,$team['id']);
    	$this->log->addDebug('channel.join findGroupById'.$channel['_id']);
    	if(!empty($channel)){
    		//$gropuid=$this->db->createGroup($name,$user['id'],$team['id'],"",'','','','channel',0);
    		//$ret=$this->db->subscribeGroup($channel['_id'],$user['id']);
    		$group=$channel;
    		$group['id']=$group['_id'];
    		unset($group['_id']);
//     		$users=$this->db->getAllUsersByGroupId($group['id'],0,100000,true);
//     		$users_ids = array();
//     		//$this->log->addDebug('joins total_rows getAllUsersByGroupId'.$users['total_rows']);
//     		foreach ($users['rows'] as $item )
//     			$users_ids[]=$item['value']['_id'];
//     		$group['members']=$users_ids;
//     		//not done!
//     		$group['unread_cnt'] = 0;
//     		$group['unread_highlight_cnt'] = 0;
    	
//     		$group['is_'.$group['type']] = true;
//     		$group['is_member'] = true;
    	
    		//$data['channel']=$group;
    		 
    		if(!isset($this->teams[$conn->Chat->teamid_str]->groups[$group['id']]))
    		{
    			$this->teams[$conn->Chat->teamid_str]->groups[$group['id']]=new \SplObjectStorage;
    			 
    			
    			 
    		}
    		$this->log->addDebug('join team:'.$conn->Chat->teamid_str." group:".$group['id']);
    		
    		$this->teams[$conn->Chat->teamid_str]->groups[$group['id']]->attach($conn);
    		$conn->Chat->groups[$group['id']]=true;
    	
    	}else{
    		//$data['error']='channel_none';
    	}
    }

    /**
     * {@inheritdoc}
     */
    function onUnSubscribe(ConnectionInterface $conn, $topic) {
//         unset($conn->Chat->rooms[$topic]);

//         if (!array_key_exists($topic, $this->rooms)) {
//             return;
//         }

//         if ($this->rooms[$topic]->contains($conn)) {
//             $this->rooms[$topic]->detach($conn);
//         }

//         if ($this->isControl($topic)) {
//             return;
//         }

//         if ($this->rooms[$topic]->count() == 0) {
//             unset($this->rooms[$topic], $this->roomLookup[array_search($topic, $this->roomLookup)]);
//             $this->broadcast(static::CTRL_ROOMS, array($topic, 0));
//         } else {
//             $this->broadcast($topic, array('leftRoom', $conn->WAMP->sessionId));
//         }
    	$groupsid=$topic;
    	$user=$conn->Chat->user;
    	$team=$this->teams[$conn->Chat->teamid_str]->teamdata;
    	$data=array();
    	$this->log->addDebug('findGroupByNameAndTeamId name:'.'id'.$team['id']);
    	$group=$this->db->findGroupById($groupsid);
    	//$channel=$self->app['spikadb']->findGroupByNameAndTeamId($name,$team['id']);
    	$this->log->addDebug('joins total_rows getAllUsersByGroupId'.$group['_id']);
    	if(!empty($group)){
    		//$gropuid=$this->db->createGroup($name,$user['id'],$team['id'],"",'','','','channel',0);
//     		if( $group['type'] != 'im')
//     			$ret=$this->db->unsubscribeGroup($channel['_id'],$user['id']);
//     		else {
//     			// set  usergroup is_archived true
    	
//     		}
    		$this->log->addDebug('leftChannel user:'.($user['name']).'group id'.$group['_id']);
    		$this->leftChannel($conn, $group['_id']);
    		 
    		$data['status']=true;
    	}else{
    		$data['error']='channel_none';
    	}
		
    }

    /**
     * {@inheritdoc}
     */
    function onPublish(ConnectionInterface $conn, $topic, $event, array $exclude = array(), array $eligible = array()) {
//         $event = (string)$event;
//         if (empty($event)) {
//             return;
//         }

//         if (!array_key_exists($topic, $conn->Chat->rooms) || !array_key_exists($topic, $this->rooms) || $this->isControl($topic)) {
//             // error, can not publish to a room you're not subscribed to
//             // not sure how to handle error - WAMP spec doesn't specify
//             // for now, we're going to silently fail

//             return;
//         }

//         $event = $this->escape($event);

//         $this->broadcast($topic, array('message', $conn->WAMP->sessionId, $event, date('c')));
    }

    /**
     * {@inheritdoc}
     */
    public function onError(ConnectionInterface $conn, \Exception $e) {
        $conn->close();
    }

    protected function broadcast($groupid, $conn, $msg, ConnectionInterface $exclude = null) {
    	$this->log->addDebug('broadcast to groupid:'.($groupid).'msg:'.print_r($msg,true));
    	 
    	$teamid=$conn->Chat->teamid_str;
    	//$this->log->addDebug('broadcast to teamid:'.$conn->Chat->teamid.'in teams:'.print_r($this->teams,true).'to groups:'.print_r($this->teams[$teamid]->groups[$groupid],true ));
        //$this->log->addDebug('broadcast to teamid:'.$conn->Chat->teamid.'in teams:'.print_r(count($this->teams),true).'to groups:'.($this->teams[$teamid]->groups[$groupid]->count() ));
        foreach ($this->teams[$teamid]->groups[$groupid] as $client) {
            if ($client !== $exclude) {
            	$client->event($groupid, $msg);
            	$this->log->addDebug('event groupid: '.$groupid);
            }
               
            
        }
    }

    /**
     * @param string
     * @return boolean
     */
    protected function isControl($room) {
        return (boolean)(substr($room, 0, strlen(static::CTRL_PREFIX)) == static::CTRL_PREFIX);
    }

    /**
     * @param string
     * @return string
     */
    protected function escape($string) {
        return htmlspecialchars($string);
    }
}
