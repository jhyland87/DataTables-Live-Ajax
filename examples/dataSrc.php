<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$employees = [
    '123001' => [
        [
            'name'   => 'Justin Hyland',
            'position' => 'Lead Developer',
            'age' => '28',
            'extn'   => '123'
        ],
        [
            'name'   => 'Justin Hyland',
            'position' => 'Lead Developer',
            'age' => '28',
            'extn'   => '124'
        ],
        [
            'name'   => 'Justin Hyland',
            'position' => 'Lead Developer',
            'age' => '29',
            'extn'   => '124'
        ]
    ],
    '123002' => [
        [
            'name'   => 'John CiaCia',
            'position' => 'Technical Consultant',
            'age' => '27',
            'extn'   => '475'
        ],
        [
            'name'   => 'John CiaCia',
            'position' => 'Technical Consultant',
            'age' => '28',
            'extn'   => '475'
        ],
        [
            'name'   => 'John CiaCia',
            'position' => 'Developer',
            'age' => '28',
            'extn'   => '475'
        ]
    ],
    '123003' => [
        [
            'name'   => 'Nathan Hyland',
            'position' => 'Intern',
            'age' => '28',
            'extn'   => '969'
        ],
        [
            'name'   => 'Nathan Hyland',
            'position' => 'Developer',
            'age' => '28',
            'extn'   => '969'
        ]
    ],
    '123004' => [
        [
            'name'   => 'Geoff Hatch',
            'position' => 'Developer',
            'age' => '32',
            'extn'   => '785'
        ],
        [
            'name'   => 'Geoff Hatch',
            'position' => 'Developer',
            'age' => '31',
            'extn'   => '785'
        ]
    ],
    '123005' => [
        [
            'name'   => 'John Doe',
            'position' => 'QA Analyst',
            'age' => '21',
            'extn'   => '634'
        ],
        [
            'name'   => 'John Doe',
            'position' => 'Engineer',
            'age' => '21',
            'extn'   => '634'
        ],
        [
            'name'   => 'John Doe',
            'position' => 'Developer',
            'age' => '21',
            'extn'   => '634'
        ]
    ],
    '123006' => [
        [
            'name'   => 'David Schmit',
            'position' => 'Marketing Agent',
            'age' => '29',
            'extn'   => '771'
        ],
        [
            'name'   => 'David Schmit',
            'position' => 'Marketing Agent',
            'age' => '29',
            'extn'   => '463'
        ],
    ],
    '123007' => [
        [
            'name'   => 'Amanda Owens',
            'position' => 'Promotion',
            'age' => '18',
            'extn'   => '412'
        ]
    ],
    '123008' => [
        [
            'name'   => 'Bob Doyle',
            'position' => 'Bartender',
            'age' => '89',
            'extn'   => 'N/A'
        ]
    ]
];

$dataSrc = [];

foreach(array_rand($employees, rand( 6, count( $employees ) -1 )) as $k => $emp_id){
    $emp = $employees[ $emp_id ][ rand( 0, count( $employees[ $emp_id ] ) -1 ) ];
    $emp['emp_id'] = $emp_id;
    array_push($dataSrc, $emp);
}

//sleep(2);

print json_encode([
    $_REQUEST['dataSrc'] ?: 'data' => $dataSrc
]);
