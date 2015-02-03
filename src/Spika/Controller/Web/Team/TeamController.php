<?php
namespace Spika\Controller\Web\Team;

use Silex\Application;
use Silex\ControllerProviderInterface;
use Symfony\Component\Debug\ExceptionHandler;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\ParameterBag;
use Doctrine\DBAL\DriverManager;
use Spika\Controller\Web\SpikaWebBaseController;
use Spika\Utils;
use Symfony\Component\HttpFoundation\Cookie;
use Guzzle\Http\Client;


class TeamController extends SpikaWebBaseController
{

    public function connect(Application $app)
    {
        parent::connect($app);
        
        $controllers = $app['controllers_factory'];
        $self = $this;
        
        
        $controllers->get('/', function (Request $request) use ($app,$self) {
            //return $app->redirect(ROOT_URL . '/client/');   
        	$teamurl=$request->getUri();
        	$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
        	if( ROOT_URL_BASE_BASE == $teamurl ){
        		$url=$request->getUri()."-yes";
        		return $app['twig']->render('client/cover.twig', array(
        				'ROOT_URL' => ROOT_URL,
        				'url'=>$url,
        				'formValues' => array(
        		
        				)
        		));
        	}else{
        		return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin');  
	       
        	}
            
        });
        
        $controllers->get('/signup/{createid}', function (Request $request,$createid) use ($app,$self) {
            //send active mail, to set username ,mail_team_signup.twig， id
            $user=$self->app['spikadb']->findUserByAttr('create_id',$createid,false);
            //
           	$reg_status=$user['reg_status'];
	        $step='step5';
	        $teamurl=$request->getUri();
	        $teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
	        $app['logger']->addDebug($teamurl);
	        $teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$teamurl);
	        if($teams['total_rows']==0)
	        	return $app->redirect(ROOT_URL);
	        $app['logger']->addDebug("team:".print_r($teams['rows'][0]));
	        $team= $teams['rows'][0]['value'];
	        $url=$team['teamdomain'];
	        $app['logger']->addDebug($teamurl.'|'.$url.'|'.$user['_id'].'|'.$reg_status);
	        
	        if(empty($user) || $teamurl!=$url )
	            return $app->redirect(ROOT_URL); 
	        $joins=$self->app['spikadb']->findJoinsByUseridandCatid($user['_id'],$team['_id']);
	        if($joins['total_rows']!=0)
	        	return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin?email='.$user['email']);  
	        $app['session']->set('email',$user['email']);
	        $app['session']->set('url',$url);
	        $app['session']->set('groupcatid',$team['_id']);
	        //$app['session']->set('url',$url);
	        if( $reg_status =="checked")
	            return $self->render('client/createcomp_step1.twig', array(
	                  'ROOT_URL' => ROOT_URL,
	                  'create_id' => $createid,
	                  'reg_status' => $reg_status, 
	                  'step' => $step, 
	                  'url' => $url,
	                  'email' => $user['email'], 
	              ));
	        else
	            return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin?email='.$user['email']);  
            
        });
        //$controllers->post('/singup', function (Request $request) use ($app,$self) {
        $controllers->post('/{go_id}', function (Request $request,$go_id) use ($app,$self) {
        	//return $app->redirect(ROOT_URL . '/client/login');
        	if($go_id=="signup")
        	{
	        	$email=$request->get("email");
	        	$emaildomain=$request->get("email_domain");
	        	$url=$request->getUri();
	        	$teamurl=substr($url,strpos($url,':')+3,strpos($url,'.')-strpos($url,':')-3);
	        	$app['logger']->addDebug($teamurl);
	        	$teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$teamurl);
	        	if($teams['total_rows']==0)
	        		return $app->redirect(ROOT_URL);
	        	//$app['logger']->addDebug(print_r($teams['rows'][0]));
	        	$team= $teams['rows'][0]['value'];
	        	$email_domains=Utils::multiexplode(array(",","|",":",'，'),$team['maildomain']);
	        	if(empty($emaildomain)&& count($email_domains)==1)
	        		$emaildomain=$email_domains[0];
	        	elseif(!in_array($emaildomain,$email_domains))
	        		return $app->redirect(ROOT_URL);
	        	//$slef->send team siginup mail, create id
	        	$go_id='';//((time()+20110608)*3).rand(19801024,20000901);
	        	$reg_status='checked';
	        	$desired_team_title='';
	        	$desired_team_id=$team['_id'];
	        	$create_id=((time()+20110608)*5).rand(19801024,20000901);
	        	$invite_user_id=-1;
	        	$inviteuserid=$self->app['spikadb']->createUserDetail('','',$email.'@'.$emaildomain,'','offline',50000,50000,0,'','','',$go_id,$reg_status,$invite_user_id,$create_id,$desired_team_title,$desired_team_id);
	        	
	        	$to=$email.'@'.$emaildomain;
	        	$subject='来自Smock的注册信';
	        	$message=$self->render('client/mail_team_signup.twig', array(
	        			'ROOT_URL' => ROOT_URL,
	        			'create_url' => ROOT_URL_HEAD.$url.'.'.ROOT_URL_BASE.'/signup/'.$create_id,
	        	)
	        	);
	        	$from_name = $email;
	        	$from_email ='hatcloud@gmail.com';
	        	$headers = 'From: $from_name <$from_email>';
	        	$result = mail($to, $subject, $message, $headers);
	            return $self->render('team/signup.twig', array(
	            	'ROOT_URL' => ROOT_URL,
	            	'ROOT_URL_BASE' => ROOT_URL_BASE,
	            	'post' => true,
	            	'url' => $team['teamdomain'],
	            	'email' => $email,
	            	'emaildomain' => $emaildomain,
	            ));
        	}  
        	elseif ($go_id=="signin")
        	{
        		$email=$request->get('email');
        		$pass=$request->get('password');
        		$errortypes=array();
        		$teamurl=$request->getUri();
        		$app['logger']->addDebug($teamurl);
        		if(empty($email) || empty($pass)|| !Utils::checkEmailIsValid($email))
        		{
        			$errortypes[]='inputvalid';
        			//return $app->redirect($teamurl);
        		}
        		else{
        			$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
        			$app['logger']->addDebug($teamurl);
        			$teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$teamurl);
        			if($teams['total_rows']==0)
        				return $app->redirect(ROOT_URL);
        			//$app['logger']->addDebug(print_r($teams['rows'][0]));
        			$team= $teams['rows'][0]['value'];
        			$email_domains=Utils::multiexplode(array(",","|",":",'，'),$team['maildomain']);
        			$email_domains=json_encode($email_domains);
        			$user=$self->app['spikadb']->findUserByAttr('email',$email,false);
        			//$app['logger']->addDebug($email.$user['email'].print_r($user));
        			if(empty($user)  )
        			{
        				$errortypes[]="nothisuser";
        			}else{
        				//$cats=$self->app['spikadb']->findCatsByUserid($user['_id']);
        		
        				 
        				//$cats=$self->app['spikadb']->findCatsByUserid($user['_id']);
        				//$app['logger']->addDebug(($user['_id']).':'.($team['_id']));
        				$joins=$self->app['spikadb']->findJoinsByUseridandCatid($user['_id'],$team['_id']);
        				if($joins['total_rows']==0)
        					$errortypes[]="notjoinedteam";
        				else
        				{
        		
        					$remember = $request->get('remember');
        					$rememberChecked = "";
        		
        					if(!empty($remember)){
        						$rememberChecked = "checked=\"checked\"";
        					}
        		
        					$authData = $self->app['spikadb']->doSpikaAuth($email,md5($pass));
        					
        					$authData = json_decode($authData,true);
//         					if( $team['creator'] == $authData['_id'])
//         						$authData['is_admin'] = true;
        					if(isset($authData['token'])){
        						$app['session']->set('user', $authData);
        						$app['session']->set('team', $team);
        						$app['logger']->addDebug(json_encode($app['session']->get('user')));
        						return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/messages/');
        					}
        					else{
        						$errortypes[]='wrongpass';
        					}
        		
        				}
        			}
        			 
        		}
        		return $self->render('team/signin_team.twig', array(
        				'ROOT_URL' => ROOT_URL,
        				'email' => $email,
        				'name' => $team['title'],
        				'email_domains' => $email_domains,
        				'errortypes' => $errortypes,
        		));
        	}
        	else
        		return $app->redirect(ROOT_URL);
        });   
               
        $controllers->post('/signin', function (Request $request) use ($app,$self) {
            $email=$request->get('email');
            $pass=$request->get('password');
            $errortypes=array();
            $teamurl=$request->getUri();
            $app['logger']->addDebug($teamurl);
            if(empty($email) || empty($pass)|| !Utils::checkEmailIsValid($email))
            {
              $errortypes[]='inputvalid';
              //return $app->redirect($teamurl); 
            }
            else{
              $teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
              $app['logger']->addDebug($teamurl);
              $teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$teamurl);
              if($teams['total_rows']==0)
                return $app->redirect(ROOT_URL); 
              //$app['logger']->addDebug(print_r($teams['rows'][0]));
              $team= $teams['rows'][0]['value'];
              $email_domains=Utils::multiexplode(array(",","|",":",'，'),$team['maildomain']);
              $email_domains=json_encode($email_domains);
              $user=$self->app['spikadb']->findUserByAttr('email',$email,false); 
              //$app['logger']->addDebug($email.$user['email'].print_r($user));
              if(empty($user)  )
              {
                $errortypes[]="nothisuser";   
              }else{
                //$cats=$self->app['spikadb']->findCatsByUserid($user['_id']);   
                
               
                //$cats=$self->app['spikadb']->findCatsByUserid($user['_id']);
              	//$app['logger']->addDebug(($user['_id']).':'.($team['_id']));
                $joins=$self->app['spikadb']->findJoinsByUseridandCatid($user['_id'],$team['_id']);
                if($joins['total_rows']==0)
                  $errortypes[]="notjoinedteam"; 
                else
                {
  
                  $remember = $request->get('remember');
                  $rememberChecked = "";
                  
                  if(!empty($remember)){
                      $rememberChecked = "checked=\"checked\"";
                  }
                  
                  $authData = $self->app['spikadb']->doSpikaAuth($email,md5($pass));
                  $authData = json_decode($authData,true);
                  
                  if(isset($authData['token'])){
                    $app['session']->set('user', $authData);
                    $app['session']->set('team', $team);
                    $app['logger']->addDebug('253'.json_encode($app['session']->get('user')));
                    return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/messages');  
                  }
                  else{
                    $errortypes[]='wrongpass';
                  }
                
                }
              }
   
            }
            return $self->render('team/signin_team.twig', array(
                  'ROOT_URL' => ROOT_URL,
                  'email' => $email,
                  'name' => $team['title'],
                  'email_domains' => $email_domains, 
                  'errortypes' => $errortypes,
              ));
            //team signin
        });

       	$controllers->get('/logout', function (Request $request) use ($app,$self) {
       		$teamurl=$request->getUri();
			$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
       			
       		$app['session']->remove('user');
       		$app['session']->remove('team');
       		return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin');  
       	});
        	
        $controllers->get('/create/{createid}', function (Request $request,$createid) use ($app,$self) {
          $user=$self->app['spikadb']->findUserByAttr('create_id',$createid,false);
          //$app['logger']->addDebug("--create_id：".$createid.'user:'.print_r($user));
          $reg_status=$user['reg_status'];
          $step='step5';
          if(empty($user))
            return $app->redirect(ROOT_URL);  
          if( $reg_status =="checked")
            return $self->render('client/createcomp_step1.twig', array(
                  'ROOT_URL' => ROOT_URL,
                  'create_id' => $createid,
                  'reg_status' => $reg_status, 
                  'step' => $step, 
                  'email' => $user['email'],
                  //'email' => $teamsbycreateid['rows'][0]['email'], 
              ));
          else
            return $app->redirect(ROOT_URL.'/signin?email='.$user['email']);  
        });
        $controllers->post('/create/{createid}', function (Request $request,$createid) use ($app,$self) {
            //return $app->redirect(ROOT_URL . '/client/login');   
            //$teamsbycreateid=$self->app['spikadb']->findGroupCategoryById(7);
            //$teamsbycreateid=$self->app['spikadb']->findGroupCatsByAttr('create_id',$teamcreateid);
            $user=$self->app['spikadb']->findUserByAttr('create_id',$createid,false);
            //$app['logger']->addDebug("--create_id：".$createid.'user:'.print_r($user));
            $step=$request->get('done');
            if( empty($user) )//ROOT_URL_BASE
              return $app->redirect(ROOT_URL); 
            else
            {
              $name=$app['session']->get('name');
              $url=strtolower($app['session']->get('url'));
              $email_domain=$app['session']->get('email_domain');
              $email_domains=$app['session']->get('email_domains');
              $email=$app['session']->get('email');
              $use_domain=$app['session']->get('use_domain');
              $invites=$app['session']->get('invites');
              $skip_invites=$app['session']->get('skip_invites');
              $username=$app['session']->get('username');
              $emailok=$app['session']->get('emailok');
              $password=$app['session']->get('password');
              $errortype=''; 
              
              //$team=$teamsbycreateid['rows'][0];
              //$app['logger']->addDebug(print_r($team));
              //$app['logger']->addDebug($team['title']);
              //$user=$self->app['spikadb']->findUserByAttr('_id',$team['creator']);
              
              
              
              $reg_status=$user['reg_status'];
              
              //if want to open switch email, comment this
              if(empty($step) || $step=="")
                $step="step1";
                
              if( false&&!empty($email) && $email!="")
              {
                $user['email']=$email;
                $user['reg_status']='emailchanged';
                $self->app['spikadb']->updateUser($user['_id'],$user,false); 
                $step="step0";
                //send an invite mail 
                //render
              }
              
              $forbids=array();
              if( $step=="step2" )
              {
                $name=$request->get('name');
                $app['session']->set('name', $name);
              }
              elseif( $step=="step3" )
              {
                $url=$request->get('url');
                if(!Utils::checkSubdomianIsValid($url))
                {
                  $step=="step2"; 
                  $errortype="invalidstring";
                }else
                {
                  $teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$url);
                  $teamcount=$teams['total_rows'];
                  if( $teams['total_rows'] >0 )
                  {
                    $step=="step2"; 
                    $errortype="urlexist";
                  }
                  else
                    $app['session']->set('url', $url);
                }  
                
                
              }
              elseif( $step=="step4" )
              {
                $email_domain=$request->get('email_domain');
                $email_domains=Utils::multiexplode(array(",","|",":",'，'),$email_domain);
                array_map('trim',$email_domains);
                $forbids=array_intersect($email_domains,Utils::get_forbid_emaildomains());
                if(count($forbids)>0)
                {
                  $step=="step3";  
                }                
                else{
                  $app['session']->set('email_domain', $email_domain);
                  $app['session']->set('use_domain', $request->get('use_domain')=="true"?true:false);
                } 
                $title=$app['session']->get('name');
                $picture='';
                $creator=$user['_id'];
                $maildomain=$app['session']->get('email_domain');
                $teamdomain=$app['session']->get('url');
                $invites=$app['session']->get('invites');
                $skip_invites=$app['session']->get('skip_invites');
                $invites_sent=0;
                $teamid=$self->app['spikadb']->createGroupCategory($title,$picture,$creator,$maildomain,$teamdomain,$use_domain,$invites,$skip_invites,$invites_sent);
                $app['session']->set('groupcatid',$teamid);
                

                
              }
              elseif($step=="step5")
              {
                /*$invite=array();
                for($index=1;$index<=50;$index++)
                {
                  if( $request->get('email_name_'.$index)=='')
                    break;
                  $invite[]=$request->get('email_name_'.$index).'@'.$request->get('email_domain_'.$index); 
                  $to=$request->get('email_name_'.$index).'@'.$request->get('email_domain_'.$index);  
                  
                  $go_id=((time()+20110608)*3).rand(19801024,20000901);
                  $reg_status='checked';
                  $desired_team_title='';
                  $create_id=((time()+20110608)*5).rand(19801024,20000901);
                  $invite_user_id=$user['_id'];
                  $desired_team_id=$app['session']->get('teamid');
                  $inviteuserid=$self->app['spikadb']->createUserDetail('','',$email,'','offline',50000,50000,0,'','','',$go_id,$reg_status,$invite_user_id,$create_id,$desired_team_title);
                  
                  $subject=$email.' 邀请你来Smock一起讨论';
                  $message=$self->render('client/mail_team_signup.twig', array(
                      'ROOT_URL' => ROOT_URL,
                      'create_url' => ROOT_URL_HEAD.$url.'.'.ROOT_URL_BASE.'/signup/'.$create_id,                
                      )
                  );
                  $from_name = $email;
                  $from_email ='hatcloud@gmail.com';
                  $headers = 'From: $from_name <$from_email>';
                  $result = mail($to, $subject, $message, $headers);  
                }
                
                if( count($invite)==0 )
                {
                  $app['session']->set('skip_invites',1);
                  $invites='';
                } 
                else
                {
                  $app['session']->set('skip_invites',0);
                  $invites=json_encode($invite);
                }
                $app['session']->set('invites', $invites);
                */
              	$step=="step6";
              }
              elseif($step=="step6")
              {
                $username=$request->get('username');
                $app['session']->set('username', $username);
              }
              elseif($step=="step7" )
              {
                $user['name']=$app['session']->get('username');
                $user['password']=md5($password);
                $user['reg_status']='actived';
                $self->app['spikadb']->updateUser($user['_id'],$user,false); 
               
                $self->app['spikadb']->subscribeGroupcat($app['session']->get('groupcatid'),$user['_id']);
                
                //creat groups:general,random, bot, <private>
                //$gropuid=$self->app['spikadb']->createGroup($name,$ownerId,$categoryId,$description,$password,$avatarURL,$thumbURL,$type);
                $teamid = $app['session']->get('groupcatid');
                
                $purpose_value="用于所有成员间的工作沟通、通知";
                $purpose=new stdClass();
                $purpose->last_set=time();
                $purpose->creator=$user['id'];
                $purpose->value=$purpose_value;
                $purpose_str=json_encode($purpose);
                $gropuid=$self->app['spikadb']->createGroup("通用",$user['_id'],$teamid,$purpose_str,'','','','public',1);
                
                $ret=$self->app['spikadb']->subscribeGroup($gropuid,$user['_id']);
                $purpose_value="工作内容之外的闲聊，插科打诨，所有成员都可参与";
                $purpose->value=$purpose_value;
                $purpose_str=json_encode($purpose);
                $gropuid=$self->app['spikadb']->createGroup("闲聊",$user['_id'],$teamid,$purpose_str,'','','','public',0);
                $ret=$self->app['spikadb']->subscribeGroup($gropuid,$user['_id']);
                //$gropuid=$self->app['spikadb']->createGroup("Bot",$user['_id'],$teamid,"和机器人侃天",'','','ptop');
                //$ret=$self->app['spikadb']->subscribeGroup($gropuid,$user['_id']);
                /*INSERT INTO `group` ( `user_id`, `name`, `description`, `group_password`, `category_id`, `avatar_file_id`, `avatar_thumb_file_id`, `created`, `modified`, `type`) VALUES
(5, '通用', '适合所有成员参与的工作话题和内容', '', 10, '', '', 1408506305, 1408506305, 'public');
INSERT INTO `group` ( `user_id`, `name`, `description`, `group_password`, `category_id`, `avatar_file_id`, `avatar_thumb_file_id`, `created`, `modified`, `type`) VALUES
(5, '闲聊', '工作内容之外的闲聊，插科打诨，所有成员都可参与', '', 10, '', '', 1408506305, 1408506305, 'public');
                */
                $ret=$self->app['spikadb']->subscribeGroup($gropuid,$user['_id']);
                
                $authData = $self->app['spikadb']->doSpikaAuth($user['name'],md5($password));
                $authData = json_decode($authData,true);
                
                if(isset($authData['token'])){
                	$app['session']->set('user', $authData);
                	$app['session']->set('team', $team);
                	$app['session']->set('logintatus',true);
                	$app['logger']->addDebug('473'.json_encode($app['session']->get('user')));
                }
                return $app->redirect(ROOT_URL_HEAD.$url.'.'.ROOT_URL_BASE.'/messages');
                //return $app->redirect(ROOT_URL_HEAD.$url.'.'.ROOT_URL_BASE.'/signin');   
              }
              return $self->render('client/createcomp_step1.twig', array(
                  'ROOT_URL' => ROOT_URL,
                  'create_id' => $createid,
                  'email' => $user['email'],
                  'reg_status' => $reg_status,
                  'step' => $step,
                  'name' => $name,
                  'url' => $url,
                  'email_domain' => $email_domain,
                  'email_domains' => $email_domains,
                  'use_domain' => $use_domain,
                  'invites' => $invites,
                  'skip_invites' => $skip_invites,
                  'username' => $username,
                  'forbids' => $forbids,
                  'errortype' => $errortype,
                  //'email' => $teamsbycreateid['rows'][0]['email'], 
                ));
            }
              
        }); 
        $controllers->get('/{go_id}', function (Request $request,$go_id) use ($app,$self) {
            //return $app->redirect(ROOT_URL . '/client/login'); 
        	$app['logger']->addDebug("get goid".$go_id);
            if($go_id == "signin")
            {
              $email=$request->get("email");  
              $url=$request->getUri(); 
              $app['logger']->addDebug("in signin url:".$url);
              if( $url==ROOT_URL.'/signin')
              {
              	$app['logger']->addDebug("ROOT_URL 11:");
                if(!empty($email))
                  $user=$self->app['spikadb']->findUserByAttr('email',$email,false);
                if(empty($email)||empty($user))
                  return $self->render('team/signin.twig', array(
                    'ROOT_URL' => ROOT_URL,
                    'ROOT_URL' => ROOT_URL,
                    'ROOT_URL_HEAD' => ROOT_URL_HEAD,
                    'ROOT_URL_BASE' => ROOT_URL_BASE,
                    'email' => $email,
                    'teamscount' => 0,
                    'teams' => array(),
                    "signinorup" => 'signin',
                  ));
                
                $cats=$self->app['spikadb']->findCatsByUserid($user['_id']);
                if($cats['total_rows']==0)
                {
                  $signinorup='siginup';
                  $self->render('team/signin.twig', array(
                      'ROOT_URL' => ROOT_URL,
                      'ROOT_URL_HEAD' => ROOT_URL_HEAD,
                      'ROOT_URL_BASE' => ROOT_URL_BASE,
                      'email' => $email,
                      'teamscount' => $cats['total_rows'],
                      'teams' => $cats['rows'],
                      "signinorup" => $signinorup,
                      
                    )); 
                } 
                elseif($cats['total_rows']==1)
                {
                  return $app->redirect(ROOT_URL_HEAD.$url.'.'.ROOT_URL_BASE.'/signin?email='.$email);    
                }  
                else
                  return $self->render('team/signin.twig', array(
                        'ROOT_URL' => ROOT_URL,
                        'ROOT_URL_HEAD' => ROOT_URL_HEAD,
                        'ROOT_URL_BASE' => ROOT_URL_BASE,
                        'email' => $email,
                        'teamscount' => $cats['total_rows'],
                        'teams' => $cats['rows'],
                        "signinorup" => $signinorup,
                        'formValues' => array(                   
                        )
                      ));
              }                
              else
              {
              	$app['logger']->addDebug("in signin url2 2");
                $teamurl=substr($url,strpos($url,':')+3,strpos($url,'.')-strpos($url,':')-3);
                $app['logger']->addDebug($teamurl);
                $teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$teamurl);
                $app['logger']->addDebug("teams 11:".$teams['total_rows']);
                if($teams['total_rows']==0)
                  return $app->redirect(ROOT_URL); 
                
                $team= $teams['rows'][0]['value'];
                $email_domains=Utils::multiexplode(array(",","|",":",'，'),$team['maildomain']);
                $addat=function ($item) {
                  return '@'.$item;               
                };
                array_map($addat,$email_domains);
                $email_domains=implode('、',$email_domains);
                return $self->render('team/signin_team.twig', array(
                    'ROOT_URL' => ROOT_URL,
                    'email' => $email,
                    'name' => $team['title'],
                    'email_domains' => $email_domains, 
                ));
              }
                
              
            }
            elseif($go_id=="signup")
            {
            	$email=$request->get("email");
            	$url=$request->getUri();
            	if( $url==ROOT_URL.'/signup')
            	{
            		$app->redirect(ROOT_URL);
            	}
            	else{
            		$teamurl=substr($url,strpos($url,':')+3,strpos($url,'.')-strpos($url,':')-3);
            		//$app['logger']->addDebug($teamurl);
            		$teams=$self->app['spikadb']->findGroupCatsByAttr('teamdomain',$teamurl);
            		if($teams['total_rows']==0)
            			return $app->redirect(ROOT_URL);
            		//$app['logger']->addDebug(print_r($teams['rows'][0]));
            		$team= $teams['rows'][0]['value'];
            		$email_domains=Utils::multiexplode(array(",","|",":",'，'),$team['maildomain']);
            		
            		return $self->render('team/signup.twig', array(
            				'ROOT_URL' => ROOT_URL,
            				'email' => $email,
            				'name' => $team['title'],
            				'url' => $teamurl.'.'.ROOT_URL_BASE,
            				'email_domains' => $email_domains,
            		));
            	}	
            }
            elseif($go_id=="logout"){
            	$teamurl=$request->getUri();
            	$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
            	
            	$app['session']->remove('user');
            	$app['session']->remove('team');
            	return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin');
            }
            $user=$self->app['spikadb']->findUserByAttr('go_id',$go_id,false); 
            if($user)  {
              
              $to=$user['email'];
              $subject="你已成功注册 思客 ";
              $message=$self->render('client/mail_setup_team.twig', array(
                  'ROOT_URL' => ROOT_URL,
                  'create_url' => ROOT_URL.'/create/'.$user['create_id'],               
                  )
              );
              $from_name = '思客';
              $from_email ='hatcloud@gmail.com';
              $headers = 'From: $from_name <$from_email>';
              $result = mail($to, $subject, $message, $headers);
              
              $teams=$self->app['spikadb']->findGroupCatsByAttr('title',$user['desired_team_title']);
              $teamcount=$teams['total_rows'];
              return $self->render('client/launch_new.twig', array(
                  'ROOT_URL' => ROOT_URL,
                  'email' => $user['email'],
                  //'email' => $app['session']->get('company'), 
                  'teamcount' => $teamcount,              
                      
                  )
              );
            }
            else
              return $app->redirect(ROOT_URL); 
        }); 
       
        
        
        
        return $controllers;
    }
    
}
