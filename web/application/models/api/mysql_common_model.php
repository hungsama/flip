<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Mysql_common_model extends CI_Model {
	private $db;
	public function __construct()
	{
		parent::__construct();
		$this->$db = $this->load->db('news_mongo');
	}
}

/* End of file mysql_common_model.php */
/* Location: ./application/models/api/mysql_common_model.php */