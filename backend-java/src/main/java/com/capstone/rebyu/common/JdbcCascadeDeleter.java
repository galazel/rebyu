package com.capstone.rebyu.common;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Deletes rows together with every row that references them through a foreign key whose
 * delete rule would otherwise block the delete (NO ACTION / RESTRICT). The FK graph is read
 * from the live schema, so tables added later are covered without touching this class.
 */
@Component
@RequiredArgsConstructor
public class JdbcCascadeDeleter {

    private static final Pattern IDENTIFIER = Pattern.compile("[a-z_][a-z0-9_]*");

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    private record ChildKey(String childTable, String childColumn, String parentColumn) {
    }

    private volatile Map<String, List<ChildKey>> blockingChildren;
    private volatile Map<String, String> primaryKeys;
    private volatile java.util.Set<String> compositeKeyTables;

    public int deleteWhere(String table, String column, Collection<?> values) {
        if (values == null || values.isEmpty()) {
            return 0;
        }
        String pk = primaryKey(table);
        if (pk == null) {
            return named.update("DELETE FROM " + id(table) + " WHERE " + id(column) + " IN (:values)",
                    new MapSqlParameterSource("values", values));
        }
        List<Object> ids = named.queryForList(
                "SELECT " + id(pk) + " FROM " + id(table) + " WHERE " + id(column) + " IN (:values)",
                new MapSqlParameterSource("values", values), Object.class);
        return deleteByIds(table, pk, ids);
    }

    private int deleteByIds(String table, String pk, List<Object> ids) {
        if (ids.isEmpty()) {
            return 0;
        }
        for (ChildKey child : children(table)) {
            List<Object> referenced = child.parentColumn().equals(pk)
                    ? ids
                    : named.queryForList("SELECT " + id(child.parentColumn()) + " FROM " + id(table)
                            + " WHERE " + id(pk) + " IN (:ids)", new MapSqlParameterSource("ids", ids), Object.class);
            if (child.childTable().equals(table)) {
                List<Object> nested = named.queryForList("SELECT " + id(pk) + " FROM " + id(table)
                                + " WHERE " + id(child.childColumn()) + " IN (:refs) AND " + id(pk) + " NOT IN (:ids)",
                        new MapSqlParameterSource("refs", referenced).addValue("ids", ids), Object.class);
                deleteByIds(table, pk, nested);
            } else {
                deleteWhere(child.childTable(), child.childColumn(), referenced);
            }
        }
        return named.update("DELETE FROM " + id(table) + " WHERE " + id(pk) + " IN (:ids)",
                new MapSqlParameterSource("ids", ids));
    }

    private List<ChildKey> children(String table) {
        if (blockingChildren == null) {
            Map<String, List<ChildKey>> graph = new HashMap<>();
            jdbc.query("""
                    SELECT ccu.table_name, tc.table_name, kcu.column_name, ccu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage ccu
                      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
                    JOIN information_schema.referential_constraints rc
                      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
                      AND rc.delete_rule IN ('NO ACTION', 'RESTRICT')
                    """, rs -> {
                graph.computeIfAbsent(rs.getString(1), key -> new ArrayList<>())
                        .add(new ChildKey(rs.getString(2), rs.getString(3), rs.getString(4)));
            });
            blockingChildren = graph;
        }
        return blockingChildren.getOrDefault(table, List.of());
    }

    private String primaryKey(String table) {
        if (primaryKeys == null) {
            Map<String, String> keys = new HashMap<>();
            java.util.Set<String> composite = new java.util.HashSet<>();
            jdbc.query("""
                    SELECT tc.table_name, kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
                    """, rs -> {
                if (keys.putIfAbsent(rs.getString(1), rs.getString(2)) != null) {
                    composite.add(rs.getString(1));
                }
            });
            compositeKeyTables = composite;
            primaryKeys = keys;
        }
        if (compositeKeyTables.contains(table)) {
            return null;
        }
        String pk = primaryKeys.get(table);
        if (pk == null) {
            throw new IllegalStateException("No primary key found for table " + table);
        }
        return pk;
    }

    private static String id(String identifier) {
        if (!IDENTIFIER.matcher(identifier).matches()) {
            throw new IllegalArgumentException("Unsafe SQL identifier: " + identifier);
        }
        return identifier;
    }
}
