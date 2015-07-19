<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Admins extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		$this->load->model();
	}

}

/* End of file admins.php */
/* Location: ./application/controllers/api/admins.php */