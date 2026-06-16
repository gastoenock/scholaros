<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class TenantDatabaseCleaner
{
    /**
     * Drop all tenant databases matching the configured prefix.
     */
    public static function dropAll(): int
    {
        $connection = config('tenancy.database.central_connection', 'central');
        $driver = config("database.connections.{$connection}.driver");
        $prefix = config('tenancy.database.prefix', 'tenant');

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            return 0;
        }

        $rows = DB::connection($connection)->select(
            'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE ?',
            [$prefix.'%'],
        );

        $dropped = 0;

        foreach ($rows as $row) {
            $name = str_replace('`', '``', $row->SCHEMA_NAME);
            DB::connection($connection)->statement("DROP DATABASE IF EXISTS `{$name}`");
            $dropped++;
        }

        return $dropped;
    }
}
