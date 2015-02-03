<?php
namespace Spika\Controller\Web\Client;

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


class GoController extends SpikaWebBaseController
{

    public function connect(Application $app)
    {
        parent::connect($app);
        
        $controllers = $app['controllers_factory'];
        $self = $this;
        
        
        $controllers->get('/launch', function (Request $request) use ($app,$self) {
          $email=$app['session']->get('email');
          $company=$app['session']->get('company');
          $emaildomain=$app['session']->set('emaildomain');
          return $self->render('client/launch.twig', array(
                  'ROOT_URL' => ROOT_URL,
                  'email' => $email,
                  //'team_domain' => $team_domain,
                  'team_email_domain' => $emaildomain,
                  'teamtitle'  => $emaildomain,            
                  
              )); 
        });
        $controllers->post('/launch', function (Request $request) use ($app,$self) {
            //return $app->redirect(ROOT_URL . '/client/login');  
            $email = trim($request->get('email'));
            $company = trim($request->get('company'));
            if( empty($email) || empty($company) || !Utils::checkEmailIsValid($email))
              return $app->redirect(ROOT_URL);
              
            $user=$self->app['spikadb']->findUserByEmail($email);
            if( !empty($user) && $user['reg_status']=='actived')     //1:checked;emailchanged;2:actived
            {
              //find teams or the one team to join
              //if( have multi teams joined)
              // go/signin
              //else  have one team joined
              // teamdomain signin
              return $app->redirect(ROOT_URL . "/signin"); 
            }
            elseif(!empty($user)) 
            {
              $go_id=$user['go_id'];
              //resend create team mail
              return $app->redirect(ROOT_URL . "/$go_id"); 
              
            } 
            $emaildomain=strstr($email,'@');
            $emaildomain=trim($emaildomain); 
            $teamsbymail=$self->app['spikadb']->findGroupCatsByAttr('maildomain',$emaildomain);
            //$teamsbytitle=$self->app['spikadb']->findGroupCatsByAttr('title',$company);
            $app['logger']->addDebug("--".$teamsbymail['total_rows']);
            //email domain is eixt, ask to select one team to send active email
            if($teamsbymail['total_rows']>0 )
            {
              //ask to send team verify mail [or send create new team mail]
              $team_domain= $teamsbymail['rows'][0]->maildomain;
              $team_title= $teamsbymail['rows'][0]->title;
              //here we make one maildomian can create one team,
              $app['session']->set('email', $email);
              $app['session']->set('company', $company);
              $app['session']->set('emaildomain', $emaildomain);
              //$app['session']->set('team_domain', $team_domain);
              return $app->redirect(ROOT_URL . "/go/launch");
            }  
            else 
            {
              // email domain is new, create new team
              //$app['session']->set('email', $email);
              //$app['session']->set('company', $company);
              //$app['session']->set('teamsbytitle', $teamsbytitle);
              
              $userName="";
              $password="";
              $email=$email;
              $about='';
              $onlineStatus='offline';
              $maxContacts=50000;
              $maxFavorites=50000;
              $birthday=0;
              $gender='';
              $avatarFile='';
              $thumbFile='';
              $go_id=((time()+20110608)*3).rand(19801024,20000901);
              $reg_status='checked';
              $desired_team_title=$company;
              $create_id=((time()+20110608)*5).rand(19801024,20000901);
              $userid=$self->app['spikadb']->createUserDetail($userName,$password,$email,$about,$onlineStatus,$maxContacts,$maxFavorites,$birthday,$gender,$avatarFile,$thumbFile,$go_id,$reg_status,$invite_user_id,$create_id,$desired_team_title);
              
              if( false )
              {
                $title=$company;
                $picture='';
                $creator=$userid;
                $maildomain='';
                $teamdomain='';
                $teamid=$self->app['spikadb']->createGroupCategory($title,$picture,$creator,$maildomain,$teamdomain);
                
                $user=$self->app['spikadb']->findUserById($userid);
                $user['desired_teamid']=-1;
                $self->app['spikadb']->updateUser($userid,$user,true);
              }
              $app['logger']->addDebug("--userid：".$userid);
              return $app->redirect(ROOT_URL . "/$go_id"); 
            }
              
              
            //return $app->redirect(ROOT_URL . '/go/singin?email=liuli2008%40xinnet.com&signup=1'); 
        }); 
        
        
        return $controllers;
    }
    
}
