<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
* Mongo Result
* @author ThinhNT
*/
class Mongo_result
{
    public $query_result;

    public $num_rows = 0;

    function __construct($result)
    {
        $this->query_result = $result;
        try {
            $this->num_rows = $this->query_result->count(true);

        } catch (Exception $e) {
            log_message('error', $e->getMessage());
            show_error($e->getMessage());
        }
    }

    /**
     * Return num of documents
     * @return int num of docs
     */
    public function num_rows($foundOnly = true)
    {
        return $this->query_result->count($foundOnly);
    }

    /**
     * Return first document in result set
     * @return Object
     */
    public function row()
    {
        if (! $this->query_result)
            return false;

        $this->query_result->rewind();

        return (object) $this->query_result->current();
    }

    /**
     * Same row() method but result is a array
     * @return array
     */
    public function row_array()
    {
        if (! $this->query_result)
            return false;

        $this->query_result->rewind();

        return $this->query_result->current();
    }

    /**
     * Same row()
     * @return Object
     */
    public function first_row($array = '')
    {
        return ($array == 'array') ? $this->row_array() : $this->row();
    }

    /**
     * Return set of results in object
     * @return array of object
     */
    public function result()
    {
        $res = array();
        foreach ($this->query_result as $row) {
            $res[] = (object) $row;
        }

        return $res;
    }

    /**
     * Return set of result
     * @return array of array
     */
    public function result_array()
    {
        return array_values(iterator_to_array($this->query_result));
    }

    public function mongo_result()
    {
        return $this->query_result;
    }

    public function check($other)
    {
        $res = $this->query_result->count(true) === $other->count(true);

        if (! $res) {
            return $res;
        }

        $this->query_result->rewind();
        $other->rewind();

        while($this->query_result->valid() or $other->valid()) {
            $res = $this->query_result->current() === $other->current();

            if (! $res) {
                break;
            }

            $this->query_result->next();
            $other->next();
        }

        return $res;
    }
}
