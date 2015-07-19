<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**************************************************************************************************
* CONTROLLER HOME 
*==================================================================================================
* CREATE BY : hungnd88@appota.com
* TIME CREATE : 20/10/2014
* TIME UPDATE : 
* PROJECT BELONG TO :   SOCIAL  NEWS
* *************************************************************************************************
*/
class Content extends CI_Controller {
    private $pagin_topic = array('start' => 0,'limit' => 10);
    private $pagin_article = array('start' => 0,'limit' => 2);
    private $pagin_follow_topic = array('start' => 0,'limit' => 10);
    public function __construct()
    {
        parent::__construct();
        $this->load->model('api/mongo_common_model', 'mongo_model');
    }

    /**
     * Hiển thị các chủ cấp cha
     * @return String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function parent_topics($is_return=false)
    {
        $data = $this->mongo_model->get_data(
            'topics', #->table
            array('_id', 'title', 'thumb', 'parent', 'alias'), #->select
            array(
                'where' => array(
                    '_id' => array('$ne' => 'topics'), 'parent' => array('$ne' => 0)
                ),
                'limit' => array($this->pagin_topic['start'], $this->pagin_topic['limit'])
            ), #->conditions
            false, #->is count records
            true #->multiple records
        );
        if ($is_return) return $data;
        if($data) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
        else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=>false)));
    }

    /**
     * Hiển thị các chủ đề cấp con
     * @return String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function child_topics($id='', $is_return=false)
    {
        $conditions = array(
            'where' => array('_id' => array('$ne' => 'topics')),
            'limit' => array($this->pagin_article['start'], $this->pagin_article['limit'])
        );
        if ($id != '' && is_numeric($id)) $conditions['where']['_id'] = $id;
        $data = $this->mongo_model->get_data(
            'topics', #->table
            array('_id', 'title', 'thumb', 'parent', 'cover'), #->select
            $conditions, #->conditions
            false, #->is count records
            true #->multiple records
        );
        if ($is_return) return $data;
        if($data) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
        else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=>false)));
    }

    /**
     * Danh sách chủ đề gợi ý (hiện trên trang home)
     * @return   String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function suggest_topics($is_return=false)
    {
        $conditions = array(
            'where' => array(
                '_id' => array('$ne' => 'topics'), 'parent' => array('$ne' => 0)
            ),
            'limit' => array($this->pagin_topic['start'], $this->pagin_topic['limit'])
        );
        $data = $this->mongo_model->get_data(
            'topics', #->table
            array('_id', 'title', 'thumb', 'parent', 'cover'), #->select
            $conditions, #->conditions
            false, #->is count records
            true #->multiple records
        );
        if ($is_return) return $data;
        if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
        else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=>false)));
    }

    /**
     * Danh sách bài viết hiện trên home
     * @return   String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function list_articles($is_return=false)
    {
        $conditions = array(
            'where' => array(
                '_id' => array('$ne' => 'news'), 'publish' => 1, 'role' => 0
            ),
            'limit' => array($this->pagin_article['start'], $this->pagin_article['limit'])
        );
        if (empty($_POST))
        {
            $postData = file_get_contents('php://input');
            $_POST = json_decode($postData, true);
        }
        
        # Begin __________ Process topic allow __________
        $topic_id = trim($this->input->post("topic_id", true));
        if ($topic_id && is_numeric($topic_id)) {
        }
        else
        {
            $topic_alias = trim($this->input->post("topic_alias", true));
            if ($topic_alias && !is_numeric($topic_alias))
            {
                
            }
        }
        # End __________ Process topic allow __________
        $user_id = trim($this->input->post("user_id", true)); 
        if ($user_id && is_numeric($user_id)) $conditions['where']['user_id'] = intval($user_id);
        
        $type = trim($this->input->post("typeTop", true));
        if ($type && in_array($type, array('newest', 'viewest', 'random')))
        {
            switch ($type) :
                case 'newest':
                    $conditions['order_by'] = array('time_creates' => 'desc');
                    break;
                case 'viewest':
                    $conditions['order_by'] = array('total_views' => 'desc');
                    break;
                default:
                    $conditions['order_by'] = array('_id' => 'desc');
                    break;
            endswitch;
        }

        $start_page = trim($this->input->post("start_page", true));
        if ($start_page && is_numeric($start_page)) $conditions['limit'][0] = $start_page;
        $limit_page = trim($this->input->post("limit_page", true));
        if ($limit_page && is_numeric($limit_page) && $limit_page < 100) $conditions['limit'][1] = $limit_page;

        $data = $this->mongo_model->get_data(
            'news', #->table
            array('_id', 'title', 'description', 'thumb', 'total_likes', 
            'total_comments', 'total_likes', 'total_rates', 'topic_id', 'time_create', 'time_update'),
            $conditions, #->conditions
            false, #->is count records
            true #->multiple records
        );
        if ($is_return) return $data;
        if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
        else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=> false)));
    }

    /**
     * Chi tiết bài viết
     * @return   String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function suggest_articles($id='', $is_return=false)
    {
        $detail = $this->detail($id, true);
        if ($detail)
        {
            $related = $this->common_model->get_data(
                'news', #->table
                array('_id', 'title', 'content', 'thumb', 'total_like', 'total_comment',
                'total_view', 'total_rate', 'time_create', 'time_update'), #->select
                array(
                    'where' => array('_id' => array('$nin' => array('news', intval($detail->_id))),
                        'publish' => 1,
                        'topic_id' => intval($detail->topic_id)
                    )
                ), #->conditions
                false, #->is count records
                true #->multiple records
            );
            if ($is_return) return $related;
            else 
            {
                if ($related) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
                else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=>false)));
            }
        }
        else
        {
            if ($is_return) return false;
            else exit(json_encode(array('error_code'=>1, 'msg'=>'Detail not found', 'data'=>false)));
        }
    }


    /**
     * Chi tiết bài viết
     * @return   String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 21/03/2015
     * Update by :
     */
    public function detail_article($id='', $is_return=false)
    {
        if ($id=='' || !is_numeric($id)) 
            exit(json_encode(array('error_code'=>2, 'msg'=>'Input error', 'data'=>false)));

        $detail = $this->mongo_model->get_data(
            'news', #->table
            array('_id', 'title', 'content', 'thumb', 'total_likes', 'total_comment',
            'total_views', 'total_rates', 'time_create', 'total_shares', 'time_update', 'topic_id'), #->select
            array(
                'where' => array('_id' => intval($id))
            ), #->conditions
            false, #->is count records
            false #->multiple records
        );
        if ($is_return) return $detail;
        if ($detail)
        {
            # Các bài viết liên quan
            $related = $this->mongo_model->get_data(
                'news', #->table
                array('_id', 'title', 'content', 'thumb', 'total_like', 'total_comment',
                'total_view', 'total_rate', 'time_create', 'time_update'), #->select
                array(
                    'where' => array('_id' => array('$nin' => array('news', intval($detail->_id))),
                        'publish' => 1,
                        'topic_id' => intval($detail->topic_id)
                    )
                ), #->conditions
                false, #->is count records
                true #->multiple records
            );
            if (!$related) $related = false;

            $result = array('detail'=>$detail, 'related' => $related);
            exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$result)));
        }
        else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=>false)));
    }

    /**
     * Chủ đề được follows nhiều
     * @return   String (json)
     * -------------------------------------------
     * Create by : hungsama@gmail.com - 28/03/2015
     * Update by :
     */
    public function topfollow_topics($is_return=false)
    {
        $data = $this->common_model->get_data(
            'topics', #->table
            array(), #->select
            array(
                'where' => array('publish' => 1),
                'order_by' => array('total_follows'),
                'limit' => array($pagin_follow_topic[0], $pagin_follow_topic[1])
            ), #->conditions
            false, #->is count records
            true #->multiple records
        );
        if ($is_return) return $data;
        if ($data) exit(json_encode(array('error_code'=>0, 'msg'=>'Success', 'data'=>$data)));
        else exit(json_encode(array('error_code'=>1, 'msg'=>'Data not found', 'data'=>$data)));
    }

    public function test()
    {
        echo "<pre>"; var_dump($_GET); echo "</pre>"; die("debug - ".date('H:i:s d-m-Y'));
        $postData = file_get_contents('php://input');
        $_PUT = json_decode($postData, true);
        echo "<pre>"; var_dump($_PUT); echo "</pre>"; die("debug - ".date('H:i:s d-m-Y'));
    }
}

/* End of file content.php */
/* Location: ./application/controllers/api/content.php */