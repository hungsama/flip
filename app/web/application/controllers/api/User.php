<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
require APPPATH.'/libraries/REST_Controller.php';
class Users extends REST_Controller {
  private $p_topic = array('start' => 0,'limit' => 2);
  private $p_article = array('start' => 0,'limit' => 2);
  private $p_friends = array('start' => 0,'limit' => 1);

  public function __construct()
  {
    parent::__construct();
    $this->load->model('api/mongo_common_model','common_model');
    $this->load->library('simple');
  }

  public function index_get($id="")
  {
    $get = $this->get();
    if (empty($get) || !@$get['object'])
      exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
    $get['_id'] = $id;
    switch ($get['object']) :
      case 'topics':
        $this->get_topics($get);
        break;
      case 'articles':
        $this->get_articles($get);
        break;
      case 'topics_follow':
        $this->get_suggest_topics($get);
        break;
      case 'friends_fllow':
        $this->get_detail($get);
        break;
      default:
        exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
        break;
    endswitch;
  }

  public function index_post()
  {
    $this->post()[0];
  }
  public function index_put()
  {
  }

  public function index_delete()
  {
  }

  private function topics($get=array())
  {
    
  }

  public function login()
  {
    if (empty($_POST))
    {
      $postData = file_get_contents('php://input');
      $_POST = json_decode($postData, true);
    }

    $info = $this->mongo_model->get_data(
            'users', #->table
            array(), #->select
            array(
              'where' => array('username' => trim($this->input->post("username", true)))
            ), #->conditions
            false, #->is count records
            false #->multiple records
            );
    if (!$info) exit(json_encode(array('error_code'=>1, 'msg'=>'Tên đăng nhập không chính xác', 'data'=>false)));
    if ($info->password != md5(trim($this->input->post("password", true)).$info->hash)) 
      exit(json_encode(array('error_code'=>2, 'msg'=>'Mật khẩu không chính xác', 'data'=>false)));

    $resToken = $this->mongo_model->get_data(
            'tokens', #->table
            array('access_token', 'scope'), #->select
            array(
              'where' => array(
                'user_id' => intval($info->_id),
                'publish' => 1,
                'expried_date' => array('$gte' => time())
                )
            ), #->conditions
            false, #->is count records
            false #->multiple records
            );
    if ($resToken) 
    {
      $access_token = $resToken->access_token;
      $this->mongo_model->update_data(
                'tokens', #->table
                array(
                  'where' => array('user_id' => intval($resToken->_id))
                ), #->conditions
                array('expried_date' => 864000) #->info update
                );
    }
    else 
    {
      for ($i=0; $i<5; $i++)
      {
        $tokenGenerate = md5(uniqid(mt_rand(), true).trim($this->input->post("username", true)));
        $count_token = $this->mongo_model->get_data(
                    'tokens', #->table
                    array(), #->select
                    array(
                      'where' => array('access_token' => $tokenGenerate)
                    ), #->conditions
                    true, #->is count records
                    true #->multiple records
                    );
        if ($count_token == 0)
        {
          $this->mongo_model->add_data(
                        'tokens', #->table
                        array('access_token' => $tokenGenerate, 'user_id' => intval($info->_id),
                            'expried_date' => time()+864000, 'publish' => 1, 'scope' => array()) #->info insert
                        );
          $access_token = $tokenGenerate;
          break;
        }
      }
    }
    if (!isset($access_token)) exit(json_encode(array('error_code'=>2, 'msg'=>'Đăng nhập không thành công, vui lòng thử lại', 'data'=>false)));

    $session_user = array('infoUser' => $info, 'accessToken' => $access_token);
    $this->session->set_userdata($session_user);
    $data = (object) $session_user;
    exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
  }

  public function fb_login()
  {
    if (empty($_POST))
    {
      $postData = file_get_contents('php://input');
      $_POST = json_decode($postData, true);
    }
    $access_token = $this->input->post('access_token');
        // $endpoint = FB_GRAPH.'?fields=friends.fields(birthday,name,picture.height(100).width(100))&access_token='.$access_token;
    $endpoint = FB_GRAPH.'/friends?access_token='.$access_token;
        // $endpoint = 'https://graph.facebook.com/v2.3/880747341971378/friends?access_token='.$access_token;
        // var_dump($endpoint); die;
    $res = $this->simple->call_curl($endpoint, 'GET', '');
    var_dump($res);
  }

  public function logout()
  {
    if (empty($_POST))
    {
      $postData = file_get_contents('php://input');
      $_POST = json_decode($postData, true);
    }
    $session_user = array('infoUser', 'accessToken');
    foreach ($session_user as  $value) {
      $this->session->unset_userdata($value);
    }
    exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>array())));
  }

  public function info($username='', $is_return=false)
  {
    $data = $this->mongo_model->get_data(
            'users', #->table
            array(), #->select
            array(
              'where' => array('username' => $username)
            ), #->conditions
            false, #->is count records
            false #->multiple records
            );
    if ($is_return) return $data;
    if ($data) {
      $data->total_writer = $this->mongo_model->get_data(
                'news', #->table
                array(), #->select
                array(
                  'where' => array('user_id' => $data->_id)
                ), #->conditions
                true, #->is count records
                true #->multiple records
                );
      $data->total_following = count($data->friend_follows);
      $data->total_follower = $this->mongo_model->get_data(
                'users', #->table
                array(), #->select
                array(
                  'where' => array(
                    'friend_follows' => array('$in'=>array($data->_id))
                    )
                ), #->conditions
                true, #->is count records
                true #->multiple records
                );
      exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
    }
    else exit(json_encode(array('error_code'=>0, 'msg'=>'Data not found', 'data'=>false)));
  }

    /**
     * Gợi ý follows cho user
     * @return String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function suggest_friends_follows($id='', $is_return=false)
    {
      $info = $this->info($id, true);
      if (!$info) exit(json_encode(array('error_code'=>0, 'msg'=>'Data not found', 'data'=>false)));
      $friend_follows = $info->friend_follows;
      $friend_follows[] = 'users';
      $data = $this->common_model->get_data(
            'users', #->table
            array(), #->select
            array(
              'where' => array('_id' => array('$nin' => $friend_follows)),
              'limit' => array($this->pagin_suggest_friend[0], $this->pagin_suggest_friend[1])
            ), #->conditions
            false, #->is count records
            true #->multiple records
            );
      if ($is_return) return $suggest_friends;
      if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
      else exit(json_encode(array('error_code'=>0, 'msg'=>'Data not found', 'data'=>false)));
    }

    public function topUsersFollow()
    {
      $this->common_model->get_data(
            '', #->table
            array(), #->select
            array(
              'where' => array()
            ), #->conditions
            true, #->is count records
            true #->multiple records
            );
    }

    public function followsGeneral()
    {
        # Begin __________ get follows topic for user __________
      $topics = $this->mongo_model->get_data(
            'topics', #->table
            array('_id', 'title', 'thumb', 'parent', 'cover'), #->select
            array(
              'limit' => array(0,9)
            ), #->conditions
            false, #->is count records
            true #->multiple records
            );
      unset($topics[0]);
        # End __________ get follows topic for user __________

        # Begin __________ get friend_follows for user __________
      $friends = $this->mongo_model->get_data(
            'users', #->table
            array(), #->select
            array(
              'where' => array('_id' => 20)
            ), #->conditions
            false, #->is count records
            false #->multiple records
            );

      $list_friends = array();
      foreach ($friends->friend_follows as $key => $value) {
        $list_friends[] = $this->mongo_model->get_data(
                'users', #->table
                array(), #->select
                array(
                  'where' => array('_id' => $value)
                ), #->conditions
                false, #->is count records
                false #->multiple records
                );
      }
        # End __________ get friend_follows for user __________
      $data = (object) array(
        'topics' => $topics,
        'friends' => $list_friends
        );
      exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
    }

    public function useragent()
    {
      $this->load->library('user_agent');

      if ($this->agent->is_browser())
      {
        $agent = $this->agent->browser().' '.$this->agent->version();
      }
      elseif ($this->agent->is_robot())
      {
        $agent = $this->agent->robot();
      }
      elseif ($this->agent->is_mobile())
      {
        $agent = $this->agent->mobile();
      }
      else
      {
        $agent = 'Unidentified User Agent';
      }

      echo $agent.'</br>';

        echo $this->agent->platform(); // Platform info (Windows, Linux, Mac, etc.)
      }

      public function test()
      {
        $info = $this->session->userdata('infoUser');
        echo "<pre>"; var_dump($info); echo "</pre>"; die("debug - ".date('H:i:s d-m-Y'));
      }
    }

    /* End of file users.php */
/* Location: ./application/controllers/api/users.php */