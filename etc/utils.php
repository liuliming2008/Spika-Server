<?php

namespace Spika;

class Utils{
  
  static $FORBIDDEN_DOMAINS=array("127.com","128.com","129.com");
  static public function get_forbid_emaildomains() {   
      return self::$FORBIDDEN_DOMAINS;  
  } 
  
  CONST SALT = "chinaisagreatcountry";                                                            
  static $ttl = 7200;                                                                                           
  static public function challenge($data) {   
      return hash_hmac('md5', $data, self::SALT);   
  }                                                                                                                
  static public function issueCrumb($uid, $action = -1) {   
      $i = ceil(time() / self::$ttl);   
      return substr(self::challenge($i . $action . $uid), -12, 10);   
  }                                                                                                                
  static public function verifyCrumb($uid, $crumb, $action = -1) {   
      $i = ceil(time() / self::$ttl);                                                                              
      if(substr(self::challenge($i . $action . $uid), -12, 10) == $crumb ||   
          substr(self::challenge(($i - 1) . $action . $uid), -12, 10) == $crumb)   
          return true;                                                                                       
      return false;   
  }
  
  static function multiexplode ($delimiters,$string) {
   
    $ready = str_replace($delimiters, $delimiters[0], $string);
    $launch = explode($delimiters[0], $ready);
    return  $launch;
  }        	
	static public function randString($min = 5, $max = 8)
	{
	    $length = rand($min, $max);
	    $string = '';
	    $index = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	    for ($i = 0; $i < $length; $i++) {
	        $string .= $index[rand(0, strlen($index) - 1)];
	    }
	    return $string;
	}
	
	static public function checkEmailIsValid($email)
	{
	    $regex = '/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/'; 
	    return preg_match($regex, $email);
	}

	static public function checkPasswordIsValid($password)
	{
	    $regex = '/^[a-zA-Z0-9]{6,}$/'; 
	    return preg_match($regex, $password);
	}
  static public function checkSubdomianIsValid($password)
	{
	    $regex = '/^[a-zA-Z0-9_-][a-zA-Z0-9_-]+$/'; 
	    return preg_match($regex, $password);
	}

	
}

?>