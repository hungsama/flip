<?php
/**************************************************************************************************
* APPS INFOMATION
*==================================================================================================
* CREATE BY : hungnd88@appota.com
* TIME CREATE : 05/04/2014
* PROJECT BELONG TO :   DEALER-APPOTA-COM
* *************************************************************************************************
*/
if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Mongo_common_model extends CI_Model {
    protected $db;

    public function __construct()
    {
        parent::__construct();
        $this->db = $this->load->database("mongo_news", true);
    }

    /**************************************************************************************************
     * GET ALL DATA BY SEARCH
     */
    public function get_data($collection, $select, $conditions, $count_data=false, $multiple_record=true, $is_test=false)
    {
        if(!$collection) return false;
        $this->db->from($collection);
        $this->db->select($select);
        if (!empty($conditions))
        {
            $array_keys = array_keys($conditions);
            if (in_array("aggregate", $array_keys))
            {
                $data = $this->db->aggregate($collection, $conditions["aggregate"]);
                if ($data) return $data;
                else return false;
            }
            foreach ($conditions as $key => $condition) {
                if ($key == 'where') $this->db->where($condition);
                if ($key == 'order_by') foreach ($condition as $k => $value){$this->db->order_by($k, $value);}
                if ($key == 'limit') $this->db->limit($condition[1], $condition[0]);
                if ($key == 'distinct') {
                    if (isset($conditions["where"])) $this->db->where($conditions["where"]);
                    $data = $this->db->distinct($condition[0], $condition[1]);
                    if (count($data) > 0) return $data;
                    else return false;
                }
            }
        }
        if ($count_data == true)
        {
            $data = $this->db->count_all_results();
            return $data;
        }
        else $query = $this->db->get();

        if ($query->num_rows > 0)
        {
            if ($multiple_record == true) $data = $query->result(); else $data = $query->row();
        }
        else $data = false;
        return $data;
    }

    /**************************************************************************************************
     * ADD DATA
     */
    public function add_data($collection = '', $data = array(), $is_test = false)
    {
        if ($collection == '' || empty($data)) return false;
        $res = $this->res_auto_increment($collection);
        if ($res != null && $res != false) $data['_id'] = intval($res); 
        if (!empty($data)) $this->db->insert($collection, $data);
        return $this->db->insert_id();
    }

    /**************************************************************************************************
     * UPDATE DATA
     */
    public function update_data($collection = '', $conditions = array(), $data = array(), $is_test = false)
    {
        if($collection == '') return false;
        if (!empty($conditions))
        {
            $array_keys = array_keys($conditions);
            if (!in_array("where", $array_keys)) return false;
            foreach ($conditions as $key => $condition) {
                if ($key == 'distinct') $this->db->distinct($condition);
                if ($key == 'where')
                {
                    if (!is_array($condition) || empty($condition)) return false;
                    $this->db->where($condition);
                }
                if ($key == 'order_by') foreach ($condition as $k => $value){$this->db->order_by($k, $value);}
            }
            $this->db->update($collection, $data);
        }
        return true;
    }

    /*
        Remove data
     */
    public function remove_data($collection = '', $conditions = array(), $is_test = false)
    {
        if ($collection == '') return false;
        if (!empty($conditions) && is_array($conditions))
        {
            $array_keys = array_keys($conditions);
            if (!in_array("where", $array_keys)) return false;
            foreach ($conditions as $key => $condition) {
                if ($key == 'distinct') $this->db->distinct($condition);
                if ($key == 'where')
                {
                    if (!is_array($condition) || count($condition) == 0 || empty($condition)) return false;
                    $res = $this->check_null($condition);
                    if (!$res) return false;
                    $this->db->where($condition);
                }
                if ($key == 'order_by') foreach ($condition as $k => $value){$this->db->order_by($k, $value);}
                if ($key == 'limit') $this->db->limit($condition[1], $condition[0]);
            }
            $this->db->delete($collection);
        }
        return true;
    }

    public function get_all_collection()
    {
        $data = $this->db->get_list_collection();
        echo "<pre>"; print_r($data); echo "</pre>"; die("debug - ".date('H:i:s d-m-Y'));
    }

    public function create_collection($collection='')
    {
        if ($collection=='') return true;
        $this->db->create_collection($collection);
        return true;
    }

    /*
        Insert auto increment
     */
    private function res_auto_increment($collection = '', $seq = 'seq')
    {
        if ($collection == '') return false;
        $res = $this->db->get_auto_increment($collection, $seq);
        return $res;
    }

    private function check_null($array)
    {
        foreach ($array as $key => $value) {
            if (is_null($array[$key])) {
                return false;
            }
        }
        return true;
    }

    private function test_data($data, $is_stop = false)
    {
        echo "<pre>"; var_dump($data); echo "</pre>";
        if ($is_stop) die("\n Dữ liệu test \n");
    }

    public function x_encode_simple($input)
    {
        $input = $input.PRIVATE_KEY_ENDCODE;
        return strtr(base64_encode($input), '+/=', '-_,');
    }

    public function x_decode_simple($input)
    {
        $decode = base64_decode(strtr($input, '-_,', '+/='));
        return substr($decode, 0, strpos($decode, PRIVATE_KEY_ENDCODE));
    }
}

/* End of file common_model.php */
/* Location: ./application/models/common_model.php */
?>