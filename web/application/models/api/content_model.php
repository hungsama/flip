<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Content_model extends CI_Model {
    protected $ci;
    public function __construct()
    {
        parent::__construct();
        $this->ci =& get_instance();
        $this->ci->load->model('mongo_common_model', 'mongo');
    }

    public function getTopic($filter=array(), $fields=array())
    {
        $conditions = array();
        $data = $this->mongo->get_data(
            'topics', #->table
            $fields, #->select
            $conditions, #->conditions
            false, #->is count records
            false #->multiple records
        );
        if ($data) return $data;
        else return false;
    }    

    public function getArticle($filter=array())
    {
        $conditions = array();
        $data = $this->mongo->get_data(
            'topics', #->table
            $fields, #->select
            $conditions, #->conditions
            false, #->is count records
            false #->multiple records
        );
        if ($data) return $data;
        else return false;
    }
}

/* End of file content_model.php */
/* Location: ./application/models/api/content_model.php */