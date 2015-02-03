<?php

/*
 * This file is part of the Silex framework.
 *
 * Copyright (c) 2013 clover studio official account
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

class MainController extends SpikaWebBaseController
{

    public function connect(Application $app)
    {
        parent::connect($app);
        
        $controllers = $app['controllers_factory'];
        $self = $this;
    	
        $controllers->get('/test', function (Request $request) use ($app,$self) {
        	$teamurl=ROOT_URL_HEAD.$app['session']->get('team')['teamdomain'].'.'.ROOT_URL_BASE;
        	return $self->render('client/demo.html.twig', array(
        			'ROOT_URL' => ROOT_URL,
        			'teamurl' =>$teamurl,
        	));
        });
        $controllers->get('', function (Request $request) use ($app,$self) {
        	
//         	$urlhead=substr($teamurl,0,strpos($teamurl,ROOT_URL_BASE)-1);
//         	if( strpos($urlhead,ROOT_URL_HEAD)>0){
//         		$urlhead=ROOT_URL_HEAD;
//         	}elseif ( strpos($urlhead,ROOT_URL_HEAD)>0){
//         		$urlhead=ROOT_URL_HEAD;
//         	}else{
        		
//         	}
        		//         		if( ROOT_URL_BASE_BASE == $teamurl )
//         			$teamurl = null;
        		if(!$self->checkLogin()){
        			$teamurl=$request->getUri();
        			$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
        			 
        			return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin?email='.$app['session']->get('user')['email']);
        	
        		}
        	
        		$self->setVariables();
        		$teamurl=ROOT_URL_HEAD.$app['session']->get('team')['teamdomain'].'.'.ROOT_URL_BASE;
        		$app['logger']->addDebug('54'.json_encode($app['session']->get('user')));
        		return $self->render('team/main.twig', array( //msg_main2 main
        				'ROOT_URL' => ROOT_URL,
        				'teamurl' =>$teamurl,
        				'team' => $app['session']->get('team'),
        				'user' => $app['session']->get('user'),
        				'logout_url' => $teamurl.'/logout',
        				//'signin_url' => $teamurl.'/signin',
        		));
        });
        $controllers->get('/login', function (Request $request) use ($app,$self) {
        		$teamurl=$request->getUri();
        		$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
        		return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin?email='.$app['session']->get('user')['email']);
        	});        
        $controllers->get('/main2', function (Request $request) use ($app,$self) {
            
            if(!$self->checkLogin()){
                $teamurl=$request->getUri();
        		$teamurl=substr($teamurl,strpos($teamurl,':')+3,strpos($teamurl,'.')-strpos($teamurl,':')-3);
        		return $app->redirect(ROOT_URL_HEAD.$teamurl.'.'.ROOT_URL_BASE.'/signin?email='.$app['session']->get('user')['email']);
        
            }
            
            $self->setVariables();
            $teamurl=ROOT_URL_HEAD.$app['session']->get('team')['teamdomain'].'.'.ROOT_URL_BASE;
            $app['logger']->addDebug(json_encode($app['session']->get('team')));
            return $self->render('team/main.twig', array(
                'ROOT_URL' => ROOT_URL,
            	'teamurl' =>$teamurl,    
            	'team' => $app['session']->get('team'),
            	'user' => $app['session']->get('user')
            ));
        }); 
      
    
        $controllers->get('/user/{userId}', function (Request $request,$userId) use ($app,$self) {
            
            if(!$self->checkLogin()){
                return $app->redirect(ROOT_URL . '/client/login');
            }
            
            $self->setVariables();
            $teamurl=ROOT_URL_HEAD.$app['session']->get('team')['teamdomain'].'.'.ROOT_URL_BASE;
            return $self->render('team/main.twig', array(
                'ROOT_URL' => ROOT_URL,    
            	'teamurl' =>$teamurl, 
                'targetUserId' => $userId        
            ));
        }); 
      
    
        $controllers->get('/group/{groupId}', function (Request $request,$groupId) use ($app,$self) {
            
            if(!$self->checkLogin()){
                return $app->redirect(ROOT_URL . '/client/login');
            }
            
            $self->setVariables();
            $teamurl=ROOT_URL_HEAD.$app['session']->get('team')['teamdomain'].'.'.ROOT_URL_BASE;
            return $self->render('team/main.twig', array(
                'ROOT_URL' => ROOT_URL,     
            	'teamurl' =>$teamurl, 
                'targetGroupId' => $groupId        
            ));
        }); 
      
        return $controllers;
        
    }
    
}
