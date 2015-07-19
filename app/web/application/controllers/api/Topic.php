<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require APPPATH.'/libraries/REST_Controller.php';
class Topic extends REST_Controller {
  private $p_topic = array('start' => 0,'limit' => 2);
  private $p_article = array('start' => 0,'limit' => 2);
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
      case 'categories':
        $this->get_topics($get);
        break;
      case 'articles':
        $this->get_articles($get);
        break;
      case 'suggest_topics':
        $this->get_suggest_topics($get);
        break;
      case 'detail':
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


                 ##                                 ##                 
   ###           ##          ######                 ##                 
  ## ##          ##            ##                                      
  ##      ###   ####           ##     ###   ####   ###     ####   #### 
  #####  ## ##   ##            ##    ## ##  ## ##   ##    ##     ##    
  ## ##  #####   ##            ##    ## ##  ## ##   ##    ##      ###  
  ## ##  ##      ##            ##    ## ##  ## ##   ##    ##        ## 
   ####   ###     ##           ##     ###   ####   ####    ####  ####  
                                            ##                         
                                            ##
  private function get_topics($ft=array())
  {
    if (is_numeric($ft['_id']))
    {
      $cond['where'] = array('_id'=>$ft['id'], 'publish'=>1);
      $data = $this->common_model->get_data('topics', array(), $cond, false, false);
    }
    else
    {
      $cond = array('where'=>array('publish'=>1, 'parent'=>array('$ne'=>0)));
      if (@$ft['start']) $this->p_topic['start'] = (int) $ft['start'];
      $cond['limit'] = array($this->p_topic['start'], 100);
      $data = $this->common_model->get_data('topics', array(), $cond, false,true);
    }
    if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>$this->_get_msg_err(0), 'data'=>$data)));
    else exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>$data)));
  }


                 ##                          ##     ##           ###                 
   ###           ##             #            ##     ##            ##                 
  ## ##          ##            ###           ##                   ##                 
  ##      ###   ####          ## ##  # ###  ####   ###     ####   ##     ###    #### 
  #####  ## ##   ##           ## ##  ###     ##     ##    ##      ##    ## ##  ##    
  ## ##  #####   ##           #####  ##      ##     ##    ##      ##    #####   ###  
  ## ##  ##      ##           ## ##  ##      ##     ##    ##      ##    ##        ## 
   ####   ###     ##          ## ##  ##       ##   ####    ####  ####    ###   #### 

  private function get_articles($ft=array())
  {
    if (!@$ft['topic_alias'] && !is_numeric($ft['_id'])) exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
    $cond = array('where'=>array('publish'=>1));
    if (is_numeric($ft['_id'])) $cond['where']['_id'] = $ft['_id']; 
    if (@$ft['topic_alias']) $cond['where']['alias'] = strip_tags(trim($ft['topic_alias'])); 
    $topic = $this->common_model->get_data('topics', array(), $cond, false, false);
    if(!$topic) exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>false)));
    if ($topic->parent != 0) $cond = array('where'=>array('topic_id'=>(int)$topic->_id));
    else
    {
      $topic = $this->common_model->get_data('topic', array(),
        array(
          'publish'=>1,
          'parent'=>$topic_id
          ),
        false,
        true
        );

      if (!$topic) exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>false)));
      else
      {
        $list_t = array();
        foreach ($topic as $t) $list_t[] = $t->topic_id;
        $cond['where']['_id'] = array('$in'=>$list_t);
      }
    }
    if (@$ft['start']) $this->p_article['start'] = (int) $get['start'];
    $cond['limit'] = array($this->p_article['start'], $this->p_article['limit']);
    $data = $this->common_model->get_data('news', array(), $cond, false, true);
    if($data) exit(json_encode(array('error_code'=>0, 'msg'=>$this->_get_msg_err(0), 'data'=>$data)));
    else exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>false)));
  }


                                             ##                                 ##                 
   ###                                       ##          ######                 ##                 
  ## ##                                      ##            ##                                      
  ##     ## ##   ####   ####   ###    ####  ####           ##     ###   ####   ###     ####   #### 
   ###   ## ##  ## ##  ## ##  ## ##  ##      ##            ##    ## ##  ## ##   ##    ##     ##    
     ##  ## ##  ## ##  ## ##  #####   ###    ##            ##    ## ##  ## ##   ##    ##      ###  
  ## ##  ## ##  ## ##  ## ##  ##        ##   ##            ##    ## ##  ## ##   ##    ##        ## 
   ###    ## #   ####   ####   ###   ####     ##           ##     ###   ####   ####    ####  ####  
                   ##     ##                                            ##                         
                 ###    ###                                             ##
  
  private function get_suggest_topics($ft=array())
  {
    if (!is_numeric($ft['_id'])) 
    {
      $cond = array(
        'where' => array(
          '_id' => array('$ne' => 'topics'), 'parent' => array('$ne' => 0)
          ),
        'limit' => array($this->p_topic['start'], $this->p_topic['limit'])
        );
      $data = $this->common_model->get_data('topics', array(), $cond, false, true);
    }
    else
    {
      $cond = array(
        'where' => array(
          '_id' => array('$ne' => 'topics'), 'parent' => array('$ne' => 0)
          ),
        'limit' => array($this->p_topic['start'], $this->p_topic['limit'])
        );
      $data = $this->common_model->get_data('topics', array(), $cond, false, true);
    }
    if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>$this->_get_msg_err(0), 'data'=>$data)));
    else exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>false)));
  }
}

/* End of file articles.php */
/* Location: ./application/controllers/api/articles.php */




