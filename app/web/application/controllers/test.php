<?php 
include APPPATH.'libraries/REST_Controller.php';
class Test extends REST_Controller {
    function world_get() {
        $data->name = 'Mark';
        $this->response($data, 200);
    }
}
?>