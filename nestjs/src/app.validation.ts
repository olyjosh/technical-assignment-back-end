import { HttpException, HttpStatus, Injectable } from '@nestjs/common';


// JOI or nestJS Class-Validator package can be used in place of this
export default {
    schema: {},
    data: { 
        getVenues : (limit: number) => {
            if(limit && isNaN(limit))
                throw new HttpException('limit can only be number', HttpStatus.BAD_REQUEST);
        }
    }
}