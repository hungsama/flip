<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require APPPATH.'/libraries/REST_Controller.php';
class Article extends CI_Controller {
    private $p_article = array('start' => 0,'limit' => 2);
    public function __construct()
    {
        parent::__construct();
        $this->load->model('api/mongo_common_model','common_model');
    }

    public function index_get($id="")
    {
        if (is_numeric($id)) 
            $url = BASE_API.'article/'.$id.'.json';
        else $url = BASE_API.'article.json';
        $get = $this->get();
        if (!empty($get))
        {
            $url .= $url.'?';
            foreach ($get as $k => $v) {
                $url .= $k.'='.$v.'&';
            }
            $url = rtrim($url,'&');
        }
        $data = call_api($url);
    }

    public function index_post($id="")
    {
        $data = call_api($url, 'POST', $post);
    }

    public function index_put($id="")
    {
        $data = call_api($url, 'POST', $put);
    }

    public function index_delete($id="")
    {
        $data = call_api($url, 'POST', $delete);
    }
}

/* End of file Article.php */
/* Location: ./application/controllers/ajax/Article.php */