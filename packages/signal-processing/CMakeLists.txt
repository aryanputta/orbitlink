cmake_minimum_required(VERSION 3.16)
project(orbitlink_signal_processing C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

add_library(signal_processing STATIC
    src/signal_processing.c
)
target_include_directories(signal_processing PUBLIC include)
target_link_libraries(signal_processing m)

add_executable(signal_test tests/test_signal.c)
target_link_libraries(signal_test signal_processing m)

add_executable(telemetry_processor src/telemetry_processor.cpp)
target_include_directories(telemetry_processor PRIVATE include)
target_link_libraries(telemetry_processor signal_processing m)
