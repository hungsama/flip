<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require APPPATH.'/libraries/REST_Controller.php';
class Login extends REST_Controller {
  private $p_article = array('start' => 0,'limit' => 2);
  private $p_topic = array('start' => 0,'limit' => 2);
  public function __construct()
  {
    parent::__construct();
    $this->load->model('api/mongo_common_model','common_model');
  }

  public function index_get($id="")
  {
    $get = $this->get();
    if (empty($get) || !@$get['object'])
      exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
    $get['_id'] = $id;
    switch ($get['object']) :
      case 'articles':
        $this->get_articles($get);
        break;
      case 'suggest_articles':
        $this->get_suggest_articles($get);
        break;
      case 'suggest_topics':
        $this->get_suggest_topics($get);
        # code...
        break;
      default:
        exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
        break;
    endswitch;
  }

  public function index_post($id="")
  {
    $post = $this->post();
    if (empty($post) || !isset($post['object']))
      exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
    switch ($post['object']) {
      case 'login':
        $this->login($post);
        break;
      case 'logout':
        $this->logout($post);
        break;
      default:
        exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(0), 'data'=>false)));
        break;
    }
  }

  private function login($post=array())
  {
    if (!@$post['username'] || !@$post['password']) 
      exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
    $cond['where'] = array('username'=>$post['username']);
    $info = $this->common_model->get_data('users', array(), $cond, false, false);
    if (!$info) exit(json_encode(array('error_code'=>2, 'msg'=>$this->_get_msg_err(2), 'data'=>false)));
    if ($info->password != md5(trim($this->input->post("password", true)).$info->hash)) 
        exit(json_encode(array('error_code'=>3, 'msg'=>$this->_get_msg_err(3), 'data'=>false)));
    $cond['where'] = array('user_id'=>$info->_id, 'publish'=>1, 'expried_date'=>array('$gte'=>time()));
    $resToken = $this->common_model->get_data('tokens', array(), $cond, false, false);
    if ($resToken) 
    {
      $cond['where'] = array('user_id'=>$resToken->_id);
      $update = array('expried_date'=>864000);
      $access_token = $resToken->access_token;
      $this->common_model->update_data('tokens', $cond, $update);
    }
    else 
    {
        for ($i=0; $i<5; $i++)
        {
            $tokenGenerate = md5(uniqid(mt_rand(), true).trim($post['username']));
            $cond['where'] = array('access_token'=>$tokenGenerate);
            $count_token = $this->common_model->get_data('tokens', array(), $cond, true, true);
            if ($count_token == 0)
            {
              $add = array(
                'access_token'=>$tokenGenerate,
                'user_id'=>$info->_id,
                'expried_date'=>time()+864000,
                'publish'=>1,
                'scope'=>array()
              );
              $this->common_model->add_data('tokens', $add);
              $access_token = $tokenGenerate;
              break;
            }
        }
    }
    if (!isset($access_token)) exit(json_encode(array('error_code'=>4, 'msg'=>$this->_get_msg_err(4), 'data'=>false)));
    
    $session_user = array('infoUser' => $info, 'accessToken' => $access_token);
    $this->session->set_userdata($session_user);
    $data = (object) $session_user;
    exit(json_encode(array('error_code'=>0, 'msg'=>$this->_get_msg_err(0), 'data'=>$data)));
  }

  private function logout()
  {
    $session_user = array('infoUser', 'accessToken');
    foreach ($session_user as  $value) {
        $this->session->unset_userdata($value);
    }
    exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>array())));
  }
}

/* End of file Login.php */
/* Location: ./application/controllers/api/Login.php */