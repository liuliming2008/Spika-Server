<?php
// Dear FIG: Thank you for PSR-0!
use Ratchet\App;
use Ratchet\Wamp\ServerProtocol;

use Spika\Website\Chat\Bot;
use Spika\Website\Chat\ChatRoom;
use Spika\Website\MessageLogger;

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

date_default_timezone_set("PRC");

    // Composer: The greatest thing since sliced bread
    require dirname(__DIR__) . '/vendor/autoload.php';

    $host = 'testasdf.com';
    if (file_exists(__DIR__ . '/../config/config.php')) {
        require __DIR__ . '/../config/config.php';
    }

    // Setup logging
    $stdout = new StreamHandler('php://stdout');
    $logout = new Logger('SockOut');
    $login  = new Logger('Sock-In');
    $login->pushHandler($stdout);
    $logout->pushHandler($stdout);

    $app = new App($host,8080);
    $app->route('/chat',
        new Spika\Website\MessageLogger(       // Log events in case of "oh noes"
            new ServerProtocol(  // WAMP; the new hotness sub-protocol
                new Bot(         // People kept asking me if I was a bot, so I made one!
                    new ChatRoom // ...and DISCUSS!
                )
            )
            , $login
            , $logout
        ),["*"]
    );
	
    // GO GO GO!
    $app->run();
