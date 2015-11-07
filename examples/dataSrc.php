<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataSrc = [
    [
        [
            'emp_id' => 'A',
            'name'   => 'Justin Hyland',
            'extn'   => '123'
        ],
        [
            'emp_id' => 'B',
            'name'   => 'John CiaCia',
            'extn'   => '456'
        ],
        [
            'emp_id' => 'C',
            'name'   => 'Nathan Hyland',
            'extn'   => '789'
        ],
        [
            'emp_id' => 'D',
            'name'   => 'Geoff Hatch',
            'extn'   => '012'
        ],
        [
            'emp_id' => 'E',
            'name'   => 'John Doe',
            'extn'   => '345'
        ]
    ],
    [
        [
            'emp_id' => 'A',
            'name'   => 'Justin Hyland',
            'extn'   => '123'
        ],
        [
            'emp_id' => 'E',
            'name'   => 'Jock Hitch',
            'extn'   => '678'
        ],
        [
            'emp_id' => 'F',
            'name'   => 'Humpty Dumpty',
            'extn'   => '901'
        ],
        [
            'emp_id' => 'G',
            'name'   => 'Ponokeo',
            'extn'   => '234'
        ],
        [
            'emp_id' => 'H',
            'name'   => 'Marry Jane',
            'extn'   => '567'
        ]
    ]
];

print json_encode([
    $_REQUEST['dataSrc'] ?: 'data' => $dataSrc[array_rand($dataSrc, 1)]
]);