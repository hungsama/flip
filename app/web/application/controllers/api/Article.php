<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require APPPATH.'/libraries/REST_Controller.php';
class Article extends REST_Controller {
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

  public function index_post()
  {
  }

  public function index_put()
  {
  }

  public function index_delete()
  {

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
    $cond['where'] = array('publish'=>1);
    if (is_numeric($ft['_id']))
    {
      $cond['where']['_id'] = $ft['_id'];
      $data = $this->common_model->get_data('news', array(), $cond, false, false);
    }
    else
    {
      if (@$ft['typeTop'])
      {
        if ($ft['typeTop'] && in_array($ft['typeTop'], array('newest', 'viewest', 'random')))
        {
          switch ($ft['typeTop']) :
            case 'newest':
            $cond['order_by'] = array('time_create'=>'desc');
            break;
          case 'viewest':
            $cond['order_by'] = array('total_views'=>'desc');
            break;
          default:
            $cond['order_by'] = array('_id'=>'desc');
            break;
          endswitch;
        }
      }
      if (@$ft['start']) $this->p_topic['start'] = (int) $ft['start'];
      $cond['limit'] = array($this->p_article['start'], $this->p_article['limit']);
      $data = $this->common_model->get_data('news', array(), $cond, false, true);
    }
    if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>$this->_get_msg_err(0), 'data'=>$data)));
    else exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>$data)));
  }

                                             ##                          ##     ##           ###                 
   ###                                       ##             #            ##     ##            ##                 
  ## ##                                      ##            ###           ##                   ##                 
  ##     ## ##   ####   ####   ###    ####  ####          ## ##  # ###  ####   ###     ####   ##     ###    #### 
   ###   ## ##  ## ##  ## ##  ## ##  ##      ##           ## ##  ###     ##     ##    ##      ##    ## ##  ##    
     ##  ## ##  ## ##  ## ##  #####   ###    ##           #####  ##      ##     ##    ##      ##    #####   ###  
  ## ##  ## ##  ## ##  ## ##  ##        ##   ##           ## ##  ##      ##     ##    ##      ##    ##        ## 
   ###    ## #   ####   ####   ###   ####     ##          ## ##  ##       ##   ####    ####  ####    ###   ####  
                   ##     ##                                                                                     
                 ###    ### 
                 
  private function get_suggest_articles($ft=array())
  {
    if (!is_numeric($ft['_id'])) 
      exit(json_encode(array('error_code'=>1, 'msg'=>$this->_get_msg_err(1), 'data'=>false)));
    $cond = array('where'=>array('_id'=>$ft['_id'], 'publish'=>1));
    $detail = $this->common_model->get_data('news', array(), $cond, false, false);
    if ($detail)
    {
      $cond = array(
        'where'=>array(
          '_id'=>array('$nin'=>array('news', (int) $detail->_id)),
          'publish'=>1,
          'topic_id'=>(int) $detail->topic_id
          )
        );
      if (@$ft['start']) $this->p_article['start'] = (int) $ft['start'];
      $data = $this->common_model->get_data('news', array(), $cond, false, true);
      if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>$this->_get_msg_err(0), 'data'=>$data)));
      else exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>false)));
    }
    else exit(json_encode(array('error_code'=>999, 'msg'=>$this->_get_msg_err(999), 'data'=>false)));
  }
}

/* End of file articles.php */
/* Location: ./application/controllers/api/articles.php */