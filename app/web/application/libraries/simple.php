<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**************************************************************************************************
* LIB CONTAINS FUNCTION REGULAR USES 
*==================================================================================================
* CREATE BY : hungnd88@appota.com
* TIME CREATE : 24/06/2014
* TIME UPDATE : 
* PROJECT BELONG TO :   APPOTA - PUSH
* *************************************************************************************************
*/
class Simple
{
    protected   $ci;

    public function __construct()
    {
        $this->ci =& get_instance();
    }

    /**
     * [unix_time_of_start_or_end_date convert date to unix time with start date or end date]
     * @param  [string]  $date     ['d-m-Y']
     * @param  boolean $is_start [description]
     * @return [integer]            [unix time]
     */
    public function unix_time($date, $is_start= true)
    {
        $date = explode('-', $date);
        if ($is_start === false) $date = strtotime($date[2].'/'.$date[1].'/'.$date[0].' 23:59:59');
        else $date = strtotime($date[2].'/'.$date[1].'/'.$date[0].' 00:00:00');
        return $date;
    }   

    /**
     * [trans remove unicode in string]
     * @param  [string] $str [input string]
     * @return [string]      [string]
     */
    public function trans ($str){
        $unicode = array(
            'a'=>'á|à|ả|ã|ạ|ă|ắ|ặ|ằ|ẳ|ẵ|â|ấ|ầ|ẩ|ẫ|ậ',
            'd'=>'đ',
            'e'=>'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
            'i'=>'í|ì|ỉ|ĩ|ị',
            'o'=>'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
            'u'=>'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
            'y'=>'ý|ỳ|ỷ|ỹ|ỵ',
            'A'=>'Á|À|Ả|Ã|Ạ|Ă|Ắ|Ặ|Ằ|Ẳ|Ẵ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ',
            'D'=>'Đ',
            'E'=>'É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ',
            'I'=>'Í|Ì|Ỉ|Ĩ|Ị',
            'O'=>'Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ',
            'U'=>'Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự',
            'Y'=>'Ý|Ỳ|Ỷ|Ỹ|Ỵ',
        );
        
       foreach($unicode as $nonUnicode=>$uni){
            $str = preg_replace("/($uni)/i", $nonUnicode, $str);
       }
        return $str;
    }

    /**
     * [generateRandomString - random string in string]
     * @param  integer $length [description]
     * @return [type]          [description]
     */
    public function generateRandomString($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $randomString;
    }

    public function xreturn($status=true, $error=0, $msg='Thành công',$data=array())
    {
        return json_encode(array(
            'status' => $status,
            'error_code' => $error,
            'msg' => $msg,
            'data' => $data
        ));
    }

    public function _debug($data, $break = true)
    {
        echo "<pre>"; var_dump($data); echo "</pre>"; 
        if ($break === true) die('Time : '.date('H:i:s d-m-Y'));
    }

    /**
     * function call_url
     * @param  string $url    [description]
     * @param  string $method [description]
     * @param  string $data   [description]
     * @return Object         
     * ===============================================
     * create by : hungnd88@appota.com - 21/04/2015
     */
    public function call_curl($url='', $method='GET', $data='{}', $header=array())
    {
        if (!$url) return false;
        $ch = curl_init($url);
        if (!empty($header)) curl_setopt($ch, CURLOPT_HTTPHEADER, $header);

        if (in_array($method, array('POST', 'PUT', 'DELETE')))
        {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);  
        $res = curl_exec($ch);
        curl_close($ch);
        if ($this->is_json($res)) return json_decode($res);
        return false;
    }

    /**
     * function is_json
     * @param  [type]  $string      [description]
     * @param  boolean $return_data [description]
     * @return boolean
     * ===============================================  
     * create by : hungnd88@appota.com - 21/10/2015            
     */
    public function is_json($string,$return_data = false) {
        $data = json_decode($string);
        return (json_last_error() == JSON_ERROR_NONE) ? ($return_data ? $data : TRUE) : FALSE;
    }

    public function check_url_exist($url)
    {
        $file_headers = @get_headers($url);
        if($file_headers[0] == 'HTTP/1.1 404 Not Found') {
            $exists = false;
        }
        else {
            $exists = true;
        }
    }
}

/* End of file simple.php */
/* Location: ./application/libraries/simple.php */

?>